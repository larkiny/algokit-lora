import { DataBuilder, dossierProxy, randomElement, randomString, randomDateBetween } from '@makerx/ts-dossier'
import algosdk, { base64ToBytes } from 'algosdk'
import { TransactionResult } from '@/features/transactions/data/types'
import { randomBigInt, randomBigIntBetween } from '@/tests/utils/random-bigint'
import { AssetResult } from '@/features/assets/data/types'
import { utf8ToUint8Array } from '@/utils/utf8-to-uint8-array'

export class TransactionResultBuilder extends DataBuilder<TransactionResult> {
  constructor(initialState?: TransactionResult) {
    const now = new Date()
    super(
      initialState
        ? initialState
        : {
            id: randomString(52, 52).toUpperCase(),
            txType: randomElement(Object.values(algosdk.TransactionType)),
            lastValid: randomBigInt(),
            firstValid: randomBigInt(),
            fee: randomBigIntBetween(1_000n, 100_000n),
            sender: randomString(52, 52),
            confirmedRound: randomBigInt(),
            roundTime: Math.floor(randomDateBetween(new Date(now.getTime() - 123456789), now).getTime() / 1000),
            signature: new algosdk.indexerModels.TransactionSignature({
              sig: utf8ToUint8Array(randomString(88, 88)),
            }),
          }
    )
  }

  public paymentTransaction() {
    this.thing.txType = algosdk.TransactionType.pay
    this.thing.paymentTransaction = new algosdk.indexerModels.TransactionPayment({
      amount: randomBigIntBetween(10_000n, 23_6070_000n),
      receiver: randomString(52, 52),
    })
    return this
  }

  public transferTransaction(asset: AssetResult) {
    this.thing.txType = algosdk.TransactionType.axfer
    this.thing.assetTransferTransaction = new algosdk.indexerModels.TransactionAssetTransfer({
      amount: randomBigIntBetween(10_000n, 23_6070_000n),
      assetId: asset.index,
      closeAmount: 0n,
      receiver: randomString(52, 52),
    })
    return this
  }

  public appCallTransaction() {
    this.thing.txType = algosdk.TransactionType.appl
    this.thing.applicationTransaction = new algosdk.indexerModels.TransactionApplication({
      applicationId: randomBigInt(),
      onCompletion: 'noop',
    })
    return this
  }

  public stateProofTransaction() {
    this.thing.txType = algosdk.TransactionType.stpf
    // HACK: do this because the type StateProofTransactionResult is very big
    this.thing.stateProofTransaction = {} as TransactionResult['stateProofTransaction']
    return this
  }

  public heartbeatTransaction() {
    this.thing.txType = algosdk.TransactionType.hb
    this.thing.heartbeatTransaction = new algosdk.indexerModels.TransactionHeartbeat({
      hbAddress: randomString(52, 52),
      hbKeyDilution: randomBigIntBetween(1000n, 10000n),
      hbProof: new algosdk.indexerModels.HbProofFields({}),
      hbSeed: base64ToBytes(randomString(52, 52)),
      hbVoteId: base64ToBytes(randomString(52, 52)),
    })
    return this
  }
}

export const transactionResultBuilder = dossierProxy<TransactionResultBuilder, TransactionResult>(TransactionResultBuilder)
