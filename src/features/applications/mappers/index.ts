import {
  Application,
  ApplicationAbiMethods,
  ApplicationGlobalStateType,
  ApplicationGlobalStateValue,
  ApplicationSummary,
  ArgumentDefinition,
  ArgumentHint,
  MethodDefinition,
} from '../models'
import algosdk, { encodeAddress, getApplicationAddress, modelsv2 } from 'algosdk'
import isUtf8 from 'isutf8'
import { Buffer } from 'buffer'
import { ApplicationMetadataResult, ApplicationResult } from '../data/types'
import { asJson } from '@/utils/as-json'
import { Arc32AppSpec, Arc4AppSpec } from '@/features/app-interfaces/data/types'
import { isArc32AppSpec } from '@/features/common/utils'
import { CallConfigValue } from '@algorandfoundation/algokit-utils/types/app-spec'

export const asApplicationSummary = (application: ApplicationResult): ApplicationSummary => {
  return {
    id: application.id,
  }
}

export const asApplication = (application: ApplicationResult, metadata: ApplicationMetadataResult): Application => {
  return {
    id: application.id,
    name: metadata?.name,
    creator: application.params.creator,
    account: getApplicationAddress(application.id),
    globalStateSchema: application.params['global-state-schema']
      ? {
          numByteSlice: application.params['global-state-schema']['num-byte-slice'],
          numUint: application.params['global-state-schema']['num-uint'],
        }
      : undefined,
    localStateSchema: application.params['local-state-schema']
      ? {
          numByteSlice: application.params['local-state-schema']['num-byte-slice'],
          numUint: application.params['local-state-schema']['num-uint'],
        }
      : undefined,
    approvalProgram: application.params['approval-program'],
    clearStateProgram: application.params['clear-state-program'],
    globalState: asGlobalStateValue(application.params['global-state']),
    isDeleted: application.deleted ?? false,
    json: asJson(application),
  }
}

export const asGlobalStateValue = (globalState: ApplicationResult['params']['global-state']): Application['globalState'] => {
  if (!globalState) {
    return
  }

  return new Map(
    globalState
      .map(({ key, value }) => {
        return [getKey(key), getGlobalStateValue(value)] as const
      })
      .sort((a, b) => a[0].localeCompare(b[0]))
  )
}

const getKey = (key: string): string => {
  const buffer = Buffer.from(key, 'base64')

  if (isUtf8(buffer)) {
    return buffer.toString()
  } else {
    return `0x${buffer.toString('hex')}`
  }
}

const getGlobalStateValue = (tealValue: modelsv2.TealValue): ApplicationGlobalStateValue => {
  if (tealValue.type === 1) {
    return {
      type: ApplicationGlobalStateType.Bytes,
      value: getValue(tealValue.bytes),
    }
  }
  if (tealValue.type === 2) {
    return {
      type: ApplicationGlobalStateType.Uint,
      value: tealValue.uint,
    }
  }
  throw new Error(`Unknown type ${tealValue.type}`)
}

const getValue = (bytes: string) => {
  const buf = Buffer.from(bytes, 'base64')
  if (buf.length === 32) {
    return encodeAddress(new Uint8Array(buf))
  }

  if (isUtf8(buf)) {
    const utf8Decoded = buf.toString('utf8')
    // Check if the string contains any unprintable characters
    if (!utf8Decoded.match(/[\p{Cc}\p{Cn}\p{Cs}]+/gu)) {
      return utf8Decoded
    }
  }
  return buf.toString('base64')
}

const callValues: CallConfigValue[] = ['ALL', 'CALL']
const createValue: CallConfigValue[] = ['ALL', 'CREATE']

export const asApplicationAbiMethods = (appSpec: Arc32AppSpec | Arc4AppSpec): ApplicationAbiMethods => {
  const isArc32 = isArc32AppSpec(appSpec)
  const contract = isArc32 ? appSpec.contract : appSpec
  const methods = contract.methods.map((method) => {
    const abiMethod = new algosdk.ABIMethod({
      name: method.name,
      desc: method.desc,
      args: method.args,
      returns: method.returns,
    })
    const signature = abiMethod.getSignature()
    const hint = isArc32AppSpec(appSpec) && appSpec.hints ? appSpec.hints[signature] : undefined

    const methodArgs = abiMethod.args.map((arg) => {
      const argHint =
        hint && arg.name && (hint.structs?.[arg.name] || hint.default_arguments?.[arg.name])
          ? ({
              struct: hint.structs?.[arg.name],
              defaultArgument: hint.default_arguments?.[arg.name],
            } satisfies ArgumentHint)
          : undefined

      const argument = {
        name: arg.name,
        description: arg.description,
        type: arg.type,
        hint: argHint,
      } satisfies ArgumentDefinition

      return argument
    })

    return {
      name: abiMethod.name,
      signature: signature,
      description: abiMethod.description,
      arguments: methodArgs,
      abiMethod: abiMethod,
      callConfig: hint?.call_config
        ? {
            call: [
              ...(callValues.includes(hint.call_config.no_op ?? 'NEVER') ? [algosdk.OnApplicationComplete.NoOpOC] : []),
              ...(callValues.includes(hint.call_config.opt_in ?? 'NEVER') ? [algosdk.OnApplicationComplete.OptInOC] : []),
              ...(callValues.includes(hint.call_config.close_out ?? 'NEVER') ? [algosdk.OnApplicationComplete.CloseOutOC] : []),
              ...(callValues.includes(hint.call_config.update_application ?? 'NEVER')
                ? [algosdk.OnApplicationComplete.UpdateApplicationOC]
                : []),
              ...(callValues.includes(hint.call_config.delete_application ?? 'NEVER')
                ? [algosdk.OnApplicationComplete.DeleteApplicationOC]
                : []),
            ],
            create: [
              ...(createValue.includes(hint.call_config.no_op ?? 'NEVER') ? [algosdk.OnApplicationComplete.NoOpOC] : []),
              ...(createValue.includes(hint.call_config.opt_in ?? 'NEVER') ? [algosdk.OnApplicationComplete.OptInOC] : []),
              ...(createValue.includes(hint.call_config.close_out ?? 'NEVER') ? [algosdk.OnApplicationComplete.CloseOutOC] : []),
              ...(createValue.includes(hint.call_config.update_application ?? 'NEVER')
                ? [algosdk.OnApplicationComplete.UpdateApplicationOC]
                : []),
              ...(createValue.includes(hint.call_config.delete_application ?? 'NEVER')
                ? [algosdk.OnApplicationComplete.DeleteApplicationOC]
                : []),
            ],
          }
        : undefined,
      returns: {
        ...abiMethod.returns,
        hint:
          hint && hint.structs?.['output']
            ? {
                struct: hint.structs?.['output'],
              }
            : undefined,
      },
    } satisfies MethodDefinition
  })

  return {
    appSpec: isArc32 ? appSpec : undefined,
    methods,
  }
}
