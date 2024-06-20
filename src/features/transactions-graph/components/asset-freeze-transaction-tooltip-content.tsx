import { AssetFreezeTransaction, InnerAssetFreezeTransaction } from '@/features/transactions/models'
import { useMemo } from 'react'
import { transactionIdLabel, transactionTypeLabel } from '@/features/transactions/components/transaction-info'
import { TransactionLink } from '@/features/transactions/components/transaction-link'
import { transactionSenderLabel } from '@/features/transactions/components/labels'
import { AccountLink } from '@/features/accounts/components/account-link'
import { assetLabel } from '@/features/transactions/components/asset-config-transaction-info'
import { AssetIdLink } from '@/features/assets/components/asset-link'
import { assetFreezeAddressLabel, assetFreezeStatusLabel } from '@/features/transactions/components/asset-freeze-transaction-info'
import { cn } from '@/features/common/utils'
import { DescriptionList } from '@/features/common/components/description-list'
import { TransactionTypeDescriptionDetails } from '@/features/transactions/components/transaction-type-description-details'

export function AssetFreezeTransactionTooltipContent({
  transaction,
}: {
  transaction: AssetFreezeTransaction | InnerAssetFreezeTransaction
}) {
  const items = useMemo(
    () => [
      {
        dt: transactionIdLabel,
        dd: <TransactionLink transactionId={transaction.id} />,
      },
      {
        dt: transactionTypeLabel,
        dd: <TransactionTypeDescriptionDetails transaction={transaction} />,
      },
      {
        dt: transactionSenderLabel,
        dd: <AccountLink address={transaction.sender} />,
      },
      {
        dt: assetLabel,
        dd: <AssetIdLink assetId={transaction.assetId} />,
      },
      {
        dt: assetFreezeAddressLabel,
        dd: <AccountLink address={transaction.address} />,
      },
      {
        dt: assetFreezeStatusLabel,
        dd: transaction.freezeStatus,
      },
    ],
    [transaction]
  )

  return (
    <div className={cn('p-4')}>
      <DescriptionList items={items} />
    </div>
  )
}
