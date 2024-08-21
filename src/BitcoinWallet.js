import bip32 from 'bip32';
import bip39 from 'bip39';
import bitcoin from 'bitcoinjs-lib';
import axios from 'axios'; 

export class BitcoinWallet {
    constructor(network = bitcoin.networks.testnet) {
        this.network = network;
        this.mnemonic = null;
        this.node = null;
        this.address = null;
        this.privateKey = null;
    }

    criarCarteira() {
        const path = `m/49'/1'/0'/0`;

        this.mnemonic = bip39.generateMnemonic();
        const seed = bip39.mnemonicToSeedSync(this.mnemonic);

        const root = bip32.fromSeed(seed, this.network);
        const account = root.derivePath(path);
        this.node = account.derive(0).derive(0);

        this.address = bitcoin.payments.p2pkh({
            pubkey: this.node.publicKey,
            network: this.network,
        }).address;

        this.privateKey = this.node.toWIF();

        console.log("Carteira Gerada");
        console.log(`Endereço: ${this.address}`);
        console.log(`Chave Privada: ${this.privateKey}`);
        console.log(`Seed: ${this.mnemonic}`);
    }

    async enviarBTC(remetente,destinatario, quantidadeBTC, feeRate = 10) {
        if (!this.node || !this.address) {
            throw new Error("Carteira não criada. Use o método criarCarteira() primeiro.");
        }

        const utxos = await axios.get(`https://api.blockcypher.com/v1/btc/test3/addrs/${this.address}?unspentOnly=true`);
        
        const txb = new bitcoin.TransactionBuilder(this.network);
        let somaInput = 0;

        for (let utxo of utxos.data.txrefs) {
            txb.addInput(utxo.tx_hash, utxo.tx_output_n);
            somaInput += utxo.value;
            if (somaInput >= quantidadeBTC * 1e8 + feeRate * 1000) break;
        }

        const quantidadeSatoshis = Math.floor(quantidadeBTC * 1e8);
        txb.addOutput(destinatario, quantidadeSatoshis);
        
        const change = somaInput - quantidadeSatoshis - feeRate * 1000;
        if (change > 0) {
            txb.addOutput(this.address, change);
        }

        for (let i = 0; i < txb.__inputs.length; i++) {
            txb.sign(i, this.node);
        }

        const rawTransaction = txb.build().toHex();
        
        const response = await axios.post(`https://api.blockcypher.com/v1/btc/test3/txs/push`, { tx: rawTransaction });

        return response.data;
    }

    async listarTransacoes(address) {
        if (!address && !this.address) {
            throw new Error("Carteira não criada. Use o método criarCarteira() primeiro.");
        }

        const transactions = await axios.get(`https://api.blockcypher.com/v1/btc/test3/addrs/${address}`);
        
        return transactions.data.txrefs || [];
    }
}


