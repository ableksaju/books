<template>
  <Row
    :ratio="ratio"
    class="w-full px-2 group flex items-center justify-center h-row-mid"
    :class="readOnly ? '' : 'hover:bg-gray-25 dark:hover:bg-gray-900'"
  >
    <!-- Index or Remove button -->
    <div
      class="flex items-center ps-2 text-gray-600 dark:text-gray-400"
      @mouseenter="isRowIndexVisible = false"
      @mouseleave="isRowIndexVisible = true"
    >
      <span class="relative w-4 h-4 flex items-center justify-center">
        <feather-icon
          v-if="!readOnly && !isRowIndexVisible"
          name="x"
          class="
            w-4
            h-4
            -ms-1
            cursor-pointer
            rounded
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50
            dark:focus:bg-gray-800
            transition
          "
          :button="true"
          tabindex="0"
          role="button"
          aria-label="Delete row"
          @click="$emit('remove')"
          @keydown.enter="$emit('remove')"
        />
        <span
          v-if="!readOnly && isRowIndexVisible"
          class="
            absolute
            left-0
            top-0
            w-full
            h-full
            flex
            items-center
            justify-center
            focus:outline-none
            focus-visible:ring-2 focus-visible:ring-blue-500
            rounded
          "
          tabindex="0"
          role="button"
          aria-label="Delete row"
          @focus="isRowIndexVisible = false"
          @keydown.enter="$emit('remove')"
        >
          {{ row.idx + 1 }}
        </span>
      </span>
      <span v-if="readOnly">
        {{ row.idx + 1 }}
      </span>
    </div>

    <!-- Data Input Form Control -->
    <FormControl
      v-for="(df, i) in tableFields"
      :key="df.fieldname"
      :size="size"
      :df="df"
      :value="row[df.fieldname]"
      @change="(value) => onChange(df, value)"
      @focus="onFieldFocus(i)"
      @blur="onFieldBlur(i)"
    />
    <Button
      v-if="canEditRow"
      :icon="true"
      :padding="false"
      :background="false"
      @click="openRowQuickEdit"
    >
      <feather-icon
        name="edit"
        class="w-4 h-4 text-gray-600 dark:text-gray-400"
      />
    </Button>

    <!-- Error Display -->
    <div
      v-if="hasErrors"
      class="text-xs text-red-600 ps-2 col-span-full relative"
      style="bottom: 0.75rem; height: 0px"
    >
      {{ getErrorString() }}
    </div>
  </Row>
</template>
<script>
import { Doc } from 'fyo/model/doc';
import Row from 'src/components/Row.vue';
import { getErrorMessage } from 'src/utils';
import { computed, nextTick } from 'vue';
import Button from '../Button.vue';
import FormControl from './FormControl.vue';

export default {
  name: 'TableRow',
  components: {
    Row,
    FormControl,
    Button,
  },
  provide() {
    return {
      doc: computed(() => this.row),
    };
  },
  props: {
    row: Doc,
    tableFields: Array,
    size: String,
    ratio: Array,
    isNumeric: Function,
    readOnly: Boolean,
    canEditRow: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['remove', 'change'],
  data: () => ({
    isRowIndexVisible: false,
    errors: {},
  }),
  computed: {
    hasErrors() {
      return Object.values(this.errors).filter(Boolean).length;
    },
  },
  beforeCreate() {
    this.$options.components.FormControl = FormControl;
  },
  methods: {
    async onChange(df, value) {
      const fieldname = df.fieldname;
      this.errors[fieldname] = null;
      const oldValue = this.row[fieldname];
      try {
        await this.row.set(fieldname, value);
        this.$emit('change', df, value);
      } catch (e) {
        this.errors[fieldname] = getErrorMessage(e, this.row);
        this.row[fieldname] = '';
        nextTick(() => (this.row[fieldname] = oldValue));
      }
    },
    getErrorString() {
      return Object.values(this.errors).filter(Boolean).join(' ');
    },
    openRowQuickEdit() {
      if (!this.row) return;
      this.$parent.$emit('editrow', this.row);
    },
    onFieldFocus(index) {
      if (index === 0) {
        this.isRowIndexVisible = true;
      }
    },
    onFieldBlur(index) {
      if (index === 0) {
        this.isRowIndexVisible = false;
      }
    },
    focusFirstInput() {
      const firstControl = this.$el.querySelector(
        '.form-control, input, textarea, select'
      );
      if (firstControl) {
        firstControl.focus();
      }
    },
  },
};
</script>
