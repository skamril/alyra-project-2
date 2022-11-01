const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config();

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },
    goerli: {
      provider: function () {
        return new HDWalletProvider({
          mnemonic: { phrase: process.env.MNEMONIC },
          providerOrUrl: `https://goerli.infura.io/v3/${process.env.INFURA_ID}`,
        });
      },
      network_id: 5,
    },
  },
  mocha: {},
  compilers: {
    solc: {
      version: "0.8.13",
      settings: {
        optimizer: {
          enabled: false,
          runs: 200,
        },
      },
    },
  },
};
