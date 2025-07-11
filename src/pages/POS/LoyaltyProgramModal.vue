<template>
  <Modal class="h-96 w-96" :set-close-listener="false">
    <p class="text-center py-4 dark:text-gray-100">Redeem Loyalty Points</p>

    <hr class="dark:border-gray-800" />

    <div class="flex gap-2 p-3 justify-end pt-10">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="20px"
        viewBox="0 -960 960 960"
        width="20px"
        fill="#F19E39"
      >
        <path
          d="M480-60q-117 0-217.22-65.23T108.33-287.77v133.92H58.08v-220h220v50.26H146.05q44.87 89.95 137.44 151.64 92.56 61.69 196.51 61.69 74.95 0 141.19-27.89 66.25-27.9 116.04-76.35 49.8-48.45 79.81-114.31 30.01-65.86 32.32-141.19h50.25q-1.92 85.23-35.65 159.85-33.73 74.61-90.46 130.38Q716.77-124 641.19-92 565.61-60 480-60Zm-24.92-144.31v-51.54q-42.85-10.64-72.5-35.38-29.66-24.74-48.58-68.21l43.44-16.41q14.3 37.85 43.39 58.77 29.09 20.93 65.58 20.93 37.8 0 66.31-18.94 28.51-18.94 28.51-56.14 0-33.21-23.55-53.89t-89.22-46.62q-62.36-24.06-90.82-51.52-28.46-27.46-28.46-73.61 0-40.18 28.54-71.05 28.54-30.87 79.36-38.49v-48.87h47.43v48.87q34.51 3.03 62.12 22.91 27.6 19.88 43.11 51.81l-41.53 18.36q-13.7-24.54-34.75-38.53-21.05-13.99-51.46-13.99-39.21 0-62.42 19.18-23.22 19.18-23.22 49.8 0 31.28 22.18 48.95 22.18 17.66 84.43 41.1 70.52 27.49 97.72 58.31 27.21 30.82 27.21 77.28 0 26.97-10.17 47.92-10.17 20.95-27.12 35.48-16.94 14.52-39.7 23.06t-48.4 10.92v49.54h-47.43ZM60.39-490q2.69-87.15 36.8-161.96 34.12-74.81 91.23-130.19 57.12-55.39 132.12-86.62Q395.54-900 480-900q115.85 0 217.22 65.43 101.37 65.42 154.45 163.88v-135.46h50.25v220h-220v-50.26h132.03q-43.72-88.15-136.14-150.74-92.42-62.59-197.81-62.59-73.41 0-139.59 27.51t-116.23 75.58q-50.05 48.06-80.64 113.92-30.59 65.86-32.9 142.73H60.39Z"
        />
      </svg>

      <p class="dark:text-gray-100">{{ loyaltyPoints }}</p>
    </div>

    <Int
      v-if="sinvDoc.fieldMap"
      class="flex-shrink-0 px-10 pb-10"
      :show-label="true"
      :border="true"
      :focus-input="true"
      :value="sinvDoc.loyaltyPoints"
      :df="sinvDoc.fieldMap.loyaltyPoints"
      @keydown.enter="setLoyaltyPoints"
      @change="updateLoyaltyPoints"
    />

    <div class="row-start-6 grid grid-cols-2 gap-4 mt-auto mb-2 px-10">
      <div class="col-span-2">
        <Button
          class="w-full bg-green-500 dark:bg-green-700"
          style="padding: 1.35rem"
          :disabled="validationError"
          @click="setLoyaltyPoints()"
        >
          <slot>
            <p class="uppercase text-lg text-white font-semibold">
              {{ t`Save` }}
            </p>
          </slot>
        </Button>
      </div>
    </div>

    <div class="row-start-6 grid grid-cols-2 gap-4 mt-auto px-10">
      <div class="col-span-2">
        <Button
          class="w-full bg-red-500 dark:bg-red-700"
          style="padding: 1.35rem"
          @click="cancelLoyaltyProgram"
        >
          <slot>
            <p class="uppercase text-lg text-white font-semibold">
              {{ t`Cancel` }}
            </p>
          </slot>
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import Button from 'src/components/Button.vue';
import Modal from 'src/components/Modal.vue';
import { SalesInvoice } from 'models/baseModels/SalesInvoice/SalesInvoice';
import { defineComponent, inject } from 'vue';
import { t } from 'fyo';
import { showToast } from 'src/utils/interactive';
import { ModelNameEnum } from 'models/types';
import Int from 'src/components/Controls/Int.vue';

export default defineComponent({
  name: 'LoyaltyProgramModal',
  components: {
    Modal,
    Button,
    Int,
  },
  props: {
    loyaltyPoints: {
      type: Number,
      default: 0,
    },

    loyaltyProgram: {
      type: String,
      default: '',
    },
  },
  emits: ['setLoyaltyPoints', 'toggleModal'],
  setup() {
    return {
      sinvDoc: inject('sinvDoc') as SalesInvoice,
    };
  },
  data() {
    return {
      validationError: false,
    };
  },
  methods: {
    async keydownEnter(value: number) {
      await this.updateLoyaltyPoints(value);
      this.setLoyaltyPoints();
    },
    cancelLoyaltyProgram() {
      this.$emit('setLoyaltyPoints', 0);
      this.$emit('toggleModal', 'LoyaltyProgram');
    },
    async updateLoyaltyPoints(newValue: number) {
      try {
        const partyData = await this.fyo.db.get(
          ModelNameEnum.Party,
          this.sinvDoc.party as string
        );

        if (!partyData.loyaltyProgram) {
          return;
        }

        if (this.loyaltyPoints >= newValue) {
          this.sinvDoc.loyaltyPoints = newValue;
        } else {
          throw new Error(
            `${this.sinvDoc.party as string} only has ${
              this.loyaltyPoints
            } points`
          );
        }

        const loyaltyProgramDoc = await this.fyo.db.getAll(
          ModelNameEnum.LoyaltyProgram,
          {
            fields: ['conversionFactor'],
            filters: { name: partyData.loyaltyProgram as string },
          }
        );

        const loyaltyPoint =
          newValue * ((loyaltyProgramDoc[0]?.conversionFactor as number) || 0);

        if (this.sinvDoc.baseGrandTotal?.lt(loyaltyPoint)) {
          throw new Error(t`no need ${newValue} points to purchase this item`);
        }

        if (newValue < 0) {
          throw new Error(t`Points must be greater than 0`);
        }

        this.$emit('setLoyaltyPoints', this.sinvDoc.loyaltyPoints);

        this.validationError = false;
      } catch (error) {
        this.validationError = true;

        showToast({
          type: 'error',
          message: t`${error as string}`,
        });

        return;
      }
    },
    setLoyaltyPoints() {
      this.$emit('toggleModal', 'LoyaltyProgram');
    },
  },
});
</script>
