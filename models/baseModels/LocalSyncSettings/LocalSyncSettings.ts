import { Doc } from 'fyo/model/doc';
import { HiddenMap, ReadOnlyMap } from 'fyo/model/types';
import { LocalSyncMode } from 'utils/types';

export class LocalSyncSettings extends Doc {
  instanceName?: string;
  localSyncMode?: LocalSyncMode;
  localServerAddress?: string;
  localServerAuthToken?: string;
  showConnectionInfo?: boolean;
  isEnabled?: boolean;
  dataSyncInterval?: number;

  syncItem?: boolean;
  itemSyncType?: string;

  syncCustomer?: boolean;
  customerSyncType?: string;

  syncSupplier?: boolean;
  supplierSyncType?: string;

  syncSalesInvoice?: boolean;
  salesInvoiceSyncType?: string;

  syncSalesInvoicePayment?: boolean;
  sinvPaymentType?: string;

  syncStockMovement?: boolean;
  stockMovementSyncType?: string;

  syncPriceList?: boolean;
  priceListSyncType?: string;

  syncSerialNumber?: boolean;
  serialNumberSyncType?: string;

  syncBatch?: boolean;
  batchSyncType?: string;

  syncShipment?: boolean;
  shipmentSyncType?: string;

  readOnly: ReadOnlyMap = {
    localServerAuthToken: () => {
      return this.localSyncMode === 'Server';
    },
  };

  hidden: HiddenMap = {
    localSyncMode: () => !this.fyo.singles.AccountingSettings?.enableLocalSync,
    localServerAddress: () =>
      !this.fyo.singles.AccountingSettings?.enableLocalSync ||
      this.fyo.singles.LocalSyncSettings?.syncMode === 'Server',
    instanceName: () =>
      !this.fyo.singles.AccountingSettings?.enableLocalSync ||
      this.fyo.singles.LocalSyncSettings?.syncMode === 'Server',
  };
}
