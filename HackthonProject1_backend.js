const express = require('express');
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 合约配置
const CONTRACT_ABI = [
  // 这里填入合约的完整ABI
];
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// Web3配置
const provider = new HDWalletProvider(
  process.env.PRIVATE_KEY, 
  process.env.BLOCKCHAIN_PROVIDER_URL
);
const web3 = new Web3(provider);

// 创建合约实例
const nftContract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

// 获取所有艺术品
app.get('/artworks', async (req, res) => {
  try {
    const totalSupply = await nftContract.methods.totalSupply().call();
    const artworks = [];

    for (let i = 1; i <= totalSupply; i++) {
      const artwork = await nftContract.methods.artworks(i).call();
      const owner = await nftContract.methods.ownerOf(i).call();
      
      artworks.push({
        tokenId: i,
        title: artwork.title,
        artist: artwork.artist,
        description: artwork.description,
        forSale: artwork.forSale,
        price: web3.utils.fromWei(artwork.price, 'ether'),
        owner: owner
      });
    }

    res.json(artworks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个艺术品详情
app.get('/artworks/:tokenId', async (req, res) => {
  try {
    const tokenId = req.params.tokenId;
    const artwork = await nftContract.methods.artworks(tokenId).call();
    const owner = await nftContract.methods.ownerOf(tokenId).call();

    res.json({
      tokenId: tokenId,
      title: artwork.title,
      artist: artwork.artist,
      description: artwork.description,
      forSale: artwork.forSale,
      price: web3.utils.fromWei(artwork.price, 'ether'),
      owner: owner
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 铸造新的艺术品NFT
app.post('/artworks/mint', async (req, res) => {
  try {
    const { title, artist, description, fromAddress } = req.body;

    const tx = await nftContract.methods.mintArtwork(
      title, 
      artist, 
      description
    ).send({ from: fromAddress });

    res.json({
      message: '艺术品NFT铸造成功',
      transactionHash: tx.transactionHash,
      tokenId: tx.events.ArtworkMinted.returnValues.tokenId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 设置艺术品价格
app.post('/artworks/set-price', async (req, res) => {
  try {
    const { tokenId, price, fromAddress } = req.body;
    const priceInWei = web3.utils.toWei(price, 'ether');

    const tx = await nftContract.methods.setArtworkPrice(
      tokenId, 
      priceInWei
    ).send({ from: fromAddress });

    res.json({
      message: '价格设置成功',
      transactionHash: tx.transactionHash
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 购买艺术品
app.post('/artworks/buy', async (req, res) => {
  try {
    const { tokenId, price, fromAddress } = req.body;
    const priceInWei = web3.utils.toWei(price, 'ether');

    const tx = await nftContract.methods.buyArtwork(tokenId).send({
      from: fromAddress,
      value: priceInWei
    });

    res.json({
      message: '艺术品购买成功',
      transactionHash: tx.transactionHash
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取消销售
app.post('/artworks/cancel-sale', async (req, res) => {
  try {
    const { tokenId, fromAddress } = req.body;

    const tx = await nftContract.methods.cancelSale(tokenId).send({
      from: fromAddress
    });

    res.json({
      message: '取消销售成功',
      transactionHash: tx.transactionHash
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 服务器配置
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  provider.engine.stop();
  process.exit();
});


//这是一个完整的Node.js后端服务，具备以下特性：

依赖库


express：Web服务框架
web3：区块链交互
@truffle/hdwallet-provider：钱包提供程序
cors：跨域资源共享
dotenv：环境变量管理


主要接口


GET /artworks：获取所有艺术品列表
GET /artworks/:tokenId：获取单个艺术品详情
POST /artworks/mint：铸造新的艺术品NFT
POST /artworks/set-price：设置艺术品价格
POST /artworks/buy：购买艺术品
POST /artworks/cancel-sale：取消销售


安全特性


使用环境变量管理敏感信息
支持跨域请求
错误处理机制
优雅关闭服务
//
