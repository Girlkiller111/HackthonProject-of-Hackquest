import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// 合约ABI（需要替换为实际编译后的ABI）
const CONTRACT_ABI = [
  // 这里应该填入合约的完整ABI
];
const CONTRACT_ADDRESS = '您的合约部署地址';

function ArtNFTApp() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [newArtwork, setNewArtwork] = useState({
    title: '',
    artist: '',
    description: ''
  });
  const [salePrice, setSalePrice] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState(null);

  // 连接钱包
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setAccount(accounts[0]);

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const nftContract = new ethers.Contract(
          CONTRACT_ADDRESS, 
          CONTRACT_ABI, 
          signer
        );
        setContract(nftContract);
      } catch (error) {
        console.error("连接钱包失败", error);
      }
    } else {
      alert('请安装MetaMask钱包');
    }
  };

  // 铸造NFT
  const mintArtwork = async () => {
    if (!contract) return;

    try {
      const tx = await contract.mintArtwork(
        newArtwork.title, 
        newArtwork.artist, 
        newArtwork.description
      );
      await tx.wait();
      alert('艺术品NFT铸造成功');
      // 重置表单
      setNewArtwork({
        title: '',
        artist: '',
        description: ''
      });
      // 刷新艺术品列表
      fetchArtworks();
    } catch (error) {
      console.error("铸造NFT失败", error);
      alert('铸造失败：' + error.message);
    }
  };

  // 获取艺术品列表
  const fetchArtworks = async () => {
    if (!contract) return;

    try {
      const totalSupply = await contract.totalSupply();
      const artworkList = [];

      for (let i = 1; i <= totalSupply; i++) {
        const artwork = await contract.artworks(i);
        const owner = await contract.ownerOf(i);
        artworkList.push({
          tokenId: i,
          title: artwork.title,
          artist: artwork.artist,
          description: artwork.description,
          forSale: artwork.forSale,
          price: artwork.price.toString(),
          owner: owner
        });
      }

      setArtworks(artworkList);
    } catch (error) {
      console.error("获取艺术品列表失败", error);
    }
  };

  // 设置艺术品价格
  const setArtworkPrice = async (tokenId, price) => {
    if (!contract) return;

    try {
      const priceInWei = ethers.utils.parseEther(price);
      const tx = await contract.setArtworkPrice(tokenId, priceInWei);
      await tx.wait();
      alert('价格设置成功');
      fetchArtworks();
    } catch (error) {
      console.error("设置价格失败", error);
      alert('设置价格失败：' + error.message);
    }
  };

  // 购买艺术品
  const buyArtwork = async (tokenId, price) => {
    if (!contract) return;

    try {
      const tx = await contract.buyArtwork(tokenId, {
        value: ethers.utils.parseEther(price)
      });
      await tx.wait();
      alert('艺术品购买成功');
      fetchArtworks();
    } catch (error) {
      console.error("购买艺术品失败", error);
      alert('购买失败：' + error.message);
    }
  };

  // 取消销售
  const cancelSale = async (tokenId) => {
    if (!contract) return;

    try {
      const tx = await contract.cancelSale(tokenId);
      await tx.wait();
      alert('取消销售成功');
      fetchArtworks();
    } catch (error) {
      console.error("取消销售失败", error);
      alert('取消销售失败：' + error.message);
    }
  };

  // 初始化
  useEffect(() => {
    connectWallet();
  }, []);

  // 监听账户变化
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0]);
      });
    }
  }, []);

  // 每次合约初始化时获取艺术品列表
  useEffect(() => {
    if (contract) {
      fetchArtworks();
    }
  }, [contract]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">艺术品NFT平台</h1>

      {/* 连接钱包 */}
      <div className="mb-4">
        {account ? (
          <div className="text-green-600">
            已连接钱包：{account.substring(0, 6)}...{account.substring(account.length - 4)}
          </div>
        ) : (
          <button 
            onClick={connectWallet} 
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            连接钱包
          </button>
        )}
      </div>

      {/* 铸造NFT表单 */}
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-xl font-semibold mb-4">铸造新艺术品NFT</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="作品标题"
            value={newArtwork.title}
            onChange={(e) => setNewArtwork({...newArtwork, title: e.target.value})}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="艺术家"
            value={newArtwork.artist}
            onChange={(e) => setNewArtwork({...newArtwork, artist: e.target.value})}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="作品描述"
            value={newArtwork.description}
            onChange={(e) => setNewArtwork({...newArtwork, description: e.target.value})}
            className="w-full p-2 border rounded"
          />
          <button 
            onClick={mintArtwork} 
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            铸造NFT
          </button>
        </div>
      </div>

      {/* 艺术品列表 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">艺术品列表</h2>
        {artworks.map((artwork) => (
          <div 
            key={artwork.tokenId} 
            className="border p-4 mb-4 rounded flex justify-between items-center"
          >
            <div>
              <h3 className="font-bold">{artwork.title}</h3>
              <p>艺术家：{artwork.artist}</p>
              <p>描述：{artwork.description}</p>
              <p>拥有者：{artwork.owner}</p>
              {artwork.forSale && (
                <p className="text-green-600">
                  出售价格：{ethers.utils.formatEther(artwork.price)} ETH
                </p>
              )}
            </div>

            <div className="space-y-2">
              {/* 仅所有者可以设置价格 */}
              {artwork.owner.toLowerCase() === account.toLowerCase() && !artwork.forSale && (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="设置价格(ETH)"
                    value={selectedTokenId === artwork.tokenId ? salePrice : ''}
                    onChange={(e) => {
                      setSelectedTokenId(artwork.tokenId);
                      setSalePrice(e.target.value);
                    }}
                    className="w-full p-2 border rounded"
                  />
                  <button 
                    onClick={() => setArtworkPrice(artwork.tokenId, salePrice)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded"
                  >
                    出售
                  </button>
                </div>
              )}

              {/* 取消销售 */}
              {artwork.owner.toLowerCase() === account.toLowerCase() && artwork.forSale && (
                <button 
                  onClick={() => cancelSale(artwork.tokenId)}
                  className="bg-red-500 text-white px-4 py-2 rounded w-full"
                >
                  取消出售
                </button>
              )}

              {/* 购买按钮 */}
              {artwork.forSale && artwork.owner.toLowerCase() !== account.toLowerCase() && (
                <button 
                  onClick={() => buyArtwork(artwork.tokenId, ethers.utils.formatEther(artwork.price))}
                  className="bg-blue-500 text-white px-4 py-2 rounded w-full"
                >
                  购买 ({ethers.utils.formatEther(artwork.price)} ETH)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArtNFTApp;


//这是一个完整的React前端应用，实现了与艺术品NFT合约交互的所有功能。主要特点：

钱包连接


使用MetaMask连接
显示当前连接的钱包地址


功能模块


铸造新的艺术品NFT
查看所有艺术品列表
设置艺术品售价
购买艺术品
取消艺术品销售


技术细节


使用ethers.js与合约交互
使用React Hooks管理状态
使用Tailwind CSS进行样式
动态获取并显示艺术品信息
根据用户角色(拥有者/买家)动态显示操作按钮

注意事项：

需要替换CONTRACT_ADDRESS为实际部署的合约地址
需要替换CONTRACT_ABI为合约编译后的实际ABI
需要安装依赖：

ethers
tailwindcss


确保在支持Web3的环境中运行（如MetaMask）

使用建议：

添加错误处理机制
优化用户体验
增加loading状态
完善响应式设计//
