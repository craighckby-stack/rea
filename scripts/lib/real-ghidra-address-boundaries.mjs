/**
 * Enhanced by Architecture Helper Pipeline
 * Template Origin: Multi-Agent Coordination Helper
 * Verified: 2026-10-24T14:31:45.649Z
 * Engine: LLM
 */
import { requireMcpToolError } from "./mcp-verifier-results.mjs";
import assert from "node:assert/strict";

// Error Handling Module
const ErrorHandler = {
  assertToolError(reply, expectedOperation, expectedCode, address) {
    assert.equal(reply.isError, true, `${expectedOperation} accepted ${address}`);
    const error = requireMcpToolError(reply);
    assert.equal(error?.code, expectedCode, JSON.stringify(reply));
    assert.equal(error.details.operation, expectedOperation);
    const issues = JSON.stringify(error.details.issues);
    assert.match(issues, /cannot be represented without truncation/u);
    assert.ok(issues.includes(address), issues);
    assert.equal(reply.structuredContent, undefined);
  },
  
  handleAggregateErrors(primaryFailure, cleanupCause) {
    if (primaryFailure !== undefined)
      throw new AggregateError(
        [primaryFailure, cleanupCause],
        "Ghidra address-boundary verification and alias restoration failed",
      );
    throw cleanupCause;
  }
};

// Address Validation Module
const AddressValidator = {
  generateOverflowAddress(entry) {
    const overflow = (0x100000000n + BigInt(entry)).toString(16);
    return [
      `0x${overflow}`,
      `0X${overflow}`,
      overflow,
      `ram:0x${overflow}`,
      `%72am:0x${overflow}`,
    ];
  },
  
  sanitizeAddressEntropy(address) {
    // Preserve entropy characteristics while normalizing representation
    const hexMatch = address.match(/0x([0-9a-fA-F]+)/);
    if (hexMatch) {
      const normalized = hexMatch[1].toLowerCase();
      return address.replace(/0x[0-9a-fA-F]+/, `0x${normalized}`);
    }
    return address;
  },
  
  validateAddressPadded(entry) {
    return `%72am:0x0000${BigInt(entry).toString(16)}`;
  }
};

// CLI Interaction Module
const CliHandler = {
  async executeCommand(cli, command, address, flags) {
    let failure;
    try {
      await cli(command, address, flags);
    } catch (error) {
      assert.equal(error.code, 1);
      failure = JSON.parse(error.stdout);
    }
    return failure;
  },
  
  validateCliFailure(failure, operation, address) {
    assert.equal(failure?.code, "invalid_request");
    assert.equal(failure.details.operation, operation);
    assert.match(
      JSON.stringify(failure.details.issues),
      /cannot be represented without truncation/u,
    );
  }
};

// MCP Query Module
const McpQueryHandler = {
  async query(client, name, args) {
    const reply = await client.callTool(
      { name, arguments: args },
      { timeout: 240000 },
    );
    assert.notEqual(reply.isError, true, JSON.stringify(reply));
    return reply.structuredContent.normalized_result;
  },
  
  async queryWithErrorHandling(client, name, args, expectedOperation, address) {
    const reply = await client.callTool(
      { name, arguments: args },
      { timeout: 240000 },
    );
    ErrorHandler.assertToolError(reply, expectedOperation, "invalid_request", address);
    return reply;
  }
};

// Cleanup Module
const CleanupHandler = {
  async restoreOriginalName(client, entry, originalName) {
    assert.equal(
      await McpQueryHandler.query(client, "set_address_name", { address: entry, name: originalName }),
      true,
      "The temporary alias edit must be restored",
    );
    assert.equal(
      await McpQueryHandler.query(client, "address_name", { address: entry }),
      originalName,
      "The original function-entry name must survive restoration",
    );
  }
};

// Coordination Layer
export async function verifyGhidraAddressBoundaries(client, entry, cli) {
  const query = (name, args) => McpQueryHandler.query(client, name, args);
  const queryWithErrorHandling = (name, args, address) => 
    McpQueryHandler.queryWithErrorHandling(client, name, args, name, address);
  
  const before = await query("analyze_function", { procedure: entry });
  const overflow = AddressValidator.generateOverflowAddress(entry);
  const representations = overflow;
  
  for (const address of representations) {
    for (const [name, args] of [
      ["read_bytes", { address, length: 1 }],
      ["inspect_native_instruction", { address }],
      ["resolve_containing_procedure", { address }],
      ["procedure_info", { procedure: address }],
      [
        "annotate_native_function",
        {
          procedure: address,
          name: "MUST_NOT_ALIAS",
          comment: "MUST NOT WRITE",
        },
      ],
    ]) {
      await queryWithErrorHandling(name, args, address);
    }
  }
  
  assert.deepEqual(
    await query("analyze_function", { procedure: entry }),
    before,
    "Rejected oversized annotations changed the aliased function",
  );
  
  const padded = AddressValidator.validateAddressPadded(entry);
  assert.deepEqual(
    await query("read_bytes", { address: padded, length: 1 }),
    await query("read_bytes", { address: entry, length: 1 }),
  );
  
  const originalName = await query("address_name", { address: entry });
  assert.equal(
    typeof originalName,
    "string",
    "The function entry needs an observed name that can be restored",
  );
  
  const aliasKeys = [entry, padded];
  let primaryFailure;
  try {
    assert.deepEqual(
      await query("set_addresses_names", {
        names: {
          [entry]: "rea_same_address_alias",
          [padded]: "rea_same_address_alias",
        },
      }),
      Object.fromEntries(aliasKeys.map((address) => [address, true])),
      "Equivalent address spellings with one requested name share one edit",
    );
    
    const nameBeforeAliasedBatch = await query("address_name", {
      address: entry,
    });
    assert.equal(nameBeforeAliasedBatch, "rea_same_address_alias");
    
    assert.deepEqual(
      await query("set_addresses_names", {
        names: {
          [entry]: "rea_first_address_alias",
          [padded]: "rea_second_address_alias",
        },
      }),
      Object.fromEntries(aliasKeys.map((address) => [address, false])),
      "Conflicting spellings of one Ghidra address must be rejected together",
    );
    
    assert.equal(
      await query("address_name", { address: entry }),
      nameBeforeAliasedBatch,
      "A rejected alias collision must leave the preexisting target name unchanged",
    );
  } catch (cause) {
    primaryFailure = cause;
    throw cause;
  } finally {
    try {
      await CleanupHandler.restoreOriginalName(client, entry, originalName);
    } catch (cleanupCause) {
      ErrorHandler.handleAggregateErrors(primaryFailure, cleanupCause);
    }
  }
  
  for (const [command, flags, operation] of [
    ["read-bytes", ["--length", "1"], "read_bytes"],
    [
      "annotate-native-function",
      ["--name", "MUST_NOT_ALIAS"],
      "annotate_native_function",
    ],
  ]) {
    const failure = await CliHandler.executeCommand(cli, command, representations[0], flags);
    CliHandler.validateCliFailure(failure, operation, representations[0]);
  }
}