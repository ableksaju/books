import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';
import { Money } from 'pesa';
import { ModelNameEnum } from 'models/types';
import { CollectionRulesItems } from '../CollectionRulesItems.ts/CollectionRulesItems';
import { Invoice } from '../Invoice/Invoice';
import { Party } from '../Party/Party';
import { isPesa } from 'fyo/utils';

export class LoyaltyProgram extends Doc {
  collectionRules?: CollectionRulesItems[];
  expiryDuration?: number;

  async createLoyaltyPointEntry(doc: Invoice) {
    const loyaltyProgramDoc = (await this.fyo.doc.getDoc(
      ModelNameEnum.LoyaltyProgram,
      doc?.loyaltyProgram
    )) as LoyaltyProgram;
    if (!loyaltyProgramDoc.isEnabled) {
      return;
    }
    const expiryDate = new Date(Date.now());
    expiryDate.setDate(
      expiryDate.getDate() + (loyaltyProgramDoc.expiryDuration || 0)
    );
    let loyaltyProgramTier;
    let loyaltyPoint: number;

    if (doc.redeemLoyaltyPoints) {
      const conversionFactor = loyaltyProgramDoc.conversionFactor as number;
      let loyaltyAmount = this.fyo.pesa(
        -(doc.loyaltyPoints || 0) * conversionFactor
      );

      loyaltyPoint = -(doc.loyaltyPoints || 0);
      const newgrandTotal = loyaltyAmount.add(doc?.grandTotal || 0);
      console.log(newgrandTotal, 'newgrandTotal');
    } else {
      loyaltyProgramTier = this.getLoyaltyProgramTier(
        loyaltyProgramDoc,
        doc?.grandTotal as Money
      ) as CollectionRulesItems;
      if (!loyaltyProgramTier) {
        return;
      }
      const collectionFactor = loyaltyProgramTier.collectionFactor as number;
      loyaltyPoint = Math.round(doc?.grandTotal?.float || 0) * collectionFactor;
    }

    const newLoyaltyPointEntry = this.fyo.doc.getNewDoc(
      ModelNameEnum.LoyaltyPointEntry,
      {
        loyaltyProgram: doc.loyaltyProgram,
        customer: doc.party,
        invoice: doc.name,
        postingDate: new Date(Date.now()),
        purchaseAmount: doc.grandTotal,
        expiryDate: expiryDate,
        loyaltyProgramTier: loyaltyProgramTier?.tierName,
        loyaltyPoints: loyaltyPoint,
      }
    );

    return await newLoyaltyPointEntry.sync();
  }

  getLoyaltyProgramTier(
    loyaltyProgramData: LoyaltyProgram,
    grandTotal: Money
  ): CollectionRulesItems | undefined {
    if (!loyaltyProgramData.collectionRules) {
      return;
    }
    let loyaltyProgramTier: CollectionRulesItems | undefined;
    for (const row of loyaltyProgramData.collectionRules) {
      if (isPesa(row.minimumTotalSpent)) {
        const minimumSpent = row.minimumTotalSpent;
        if (!minimumSpent.lte(grandTotal)) {
          return;
        }
        if (
          !loyaltyProgramTier ||
          minimumSpent.gt(loyaltyProgramTier.minimumTotalSpent as Money)
        ) {
          loyaltyProgramTier = row;
        }
      }
    }
    return loyaltyProgramTier;
  }

  async removeLoyaltyPoint(doc: Doc) {
    const data = (await this.fyo.db.getAll(ModelNameEnum.LoyaltyPointEntry, {
      fields: ['name', 'loyaltyPoints', 'expiryDate'],
      filters: {
        loyaltyProgram: this.name as string,
        invoice: doc.name as string,
      },
    })) as { name: string; loyaltyPoints: number; expiryDate: Date }[];
    const loyalityPointEntryDoc = await this.fyo.doc.getDoc(
      ModelNameEnum.LoyaltyPointEntry,
      data[0].name
    );

    const party = (await this.fyo.doc.getDoc(
      ModelNameEnum.Party,
      doc.party as string
    )) as Party;
    await loyalityPointEntryDoc.delete();
    await party.updateLoyaltyPoints();
  }

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'fromDate', 'toDate', 'expiryDuration'],
    };
  }
}
