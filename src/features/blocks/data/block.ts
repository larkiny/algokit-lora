import { JotaiStore } from '@/features/common/data/types'
import { atom, useAtomValue, useStore } from 'jotai'
import { getTransactionResultAtoms, createTransactionsAtom } from '@/features/transactions/data'
import { asBlock } from '../mappers'
import { useMemo } from 'react'
import { loadable } from 'jotai/utils'
import { Round } from './types'
import { getBlockResultAtom } from './block-result'
import { syncedRoundAtom } from './synced-round'

const createNextRoundAvailableAtom = (store: JotaiStore, round: Round) => {
  // This atom conditionally subscribes to updates on the syncedRoundAtom
  return atom((get) => {
    const syncedRoundSnapshot = store.get(syncedRoundAtom)
    const syncedRound = syncedRoundSnapshot && round >= syncedRoundSnapshot ? get(syncedRoundAtom) : syncedRoundSnapshot
    return syncedRound ? syncedRound > round : true
  })
}

const createBlockAtom = (store: JotaiStore, round: Round) => {
  return atom(async (get) => {
    const blockResult = await get(getBlockResultAtom(store, round))
    const transactionResults = await Promise.all(getTransactionResultAtoms(store, blockResult.transactionIds).map((txn) => get(txn)))
    const transactions = await get(createTransactionsAtom(store, transactionResults))
    const nextRoundAvailable = get(createNextRoundAvailableAtom(store, round))
    return asBlock(blockResult, transactions, nextRoundAvailable)
  })
}

const useBlockAtom = (round: Round) => {
  const store = useStore()

  return useMemo(() => {
    return createBlockAtom(store, round)
  }, [store, round])
}

export const useLoadableBlock = (round: Round) => {
  return useAtomValue(loadable(useBlockAtom(round)))
}
