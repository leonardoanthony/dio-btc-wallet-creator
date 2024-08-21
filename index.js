import { BitcoinWallet } from "./src/BitcoinWallet.js";

const minhaCarteira = new BitcoinWallet();
minhaCarteira.criarCarteira();

minhaCarteira.enviarBTC('endereco_destinatario_aqui', 0.0001).then(response => {
    console.log("Transação enviada:", response);
}).catch(error => {
    console.error("Erro ao enviar transação:", error);
});

minhaCarteira.listarTransacoes('mya2LAdSvFxqcCD6yCZDEReTwQMHcovzni').then(transacoes => {
    console.log("Transações:", transacoes);
}).catch(error => {
    console.error("Erro ao listar transações:", error);
});