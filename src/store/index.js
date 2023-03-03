import { defineStore } from "pinia";

export const useStore = defineStore("test", {
  state: () => ({
    name: "Pinia",
    number: 1,
    group: "",
    tasks: [],
    wallet: "",
  }),
  actions: {
    changeName(value) {
      this.name = value;
    },
    changeNumber(value) {
      this.number = value;
    },
    changeGroup(value) {
      this.group = value;
    },
    changeTasks(value) {
      this.tasks = value;
    },
    changeWallet(value) {
      this.wallet = value;
    },
  },
});
