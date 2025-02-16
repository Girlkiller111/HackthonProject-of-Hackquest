
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SimpleArtNFT is ERC721Enumerable, Ownable, ReentrancyGuard {
    // 艺术品结构体
    struct Artwork {
        string title;
        string artist;
        string description;
        uint256 creationTime;
        bool forSale;
        uint256 price;
    }

    // 艺术品映射
    mapping(uint256 => Artwork) public artworks;

    // 事件定义
    event ArtworkMinted(uint256 tokenId, address artist, string title);
    event ArtworkPriceSet(uint256 tokenId, uint256 price);
    event ArtworkSold(uint256 tokenId, address from, address to, uint256 price);

    constructor() ERC721("SimpleArtNFT", "SNFT") {}

    // 铸造新的艺术品NFT
    function mintArtwork(
        string memory _title, 
        string memory _artist, 
        string memory _description
    ) public returns (uint256) {
        uint256 tokenId = totalSupply() + 1;
        _safeMint(msg.sender, tokenId);

        artworks[tokenId] = Artwork({
            title: _title,
            artist: _artist,
            description: _description,
            creationTime: block.timestamp,
            forSale: false,
            price: 0
        });

        emit ArtworkMinted(tokenId, msg.sender, _title);
        return tokenId;
    }

    // 设置艺术品直接售卖价格
    function setArtworkPrice(uint256 tokenId, uint256 price) public {
        require(_exists(tokenId), "Artwork does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only owner can set price");

        artworks[tokenId].forSale = true;
        artworks[tokenId].price = price;

        emit ArtworkPriceSet(tokenId, price);
    }

    // 购买艺术品
    function buyArtwork(uint256 tokenId) public payable nonReentrant {
        Artwork storage artwork = artworks[tokenId];
        require(artwork.forSale, "Artwork not for sale");
        require(msg.value >= artwork.price, "Insufficient payment");

        address seller = ownerOf(tokenId);

        // 转账给卖家
        payable(seller).transfer(artwork.price);

        // 转移NFT所有权
        _transfer(seller, msg.sender, tokenId);

        // 重置销售状态
        artwork.forSale = false;
        artwork.price = 0;

        // 退还多余的ETH
        if (msg.value > artwork.price) {
            payable(msg.sender).transfer(msg.value - artwork.price);
        }

        emit ArtworkSold(tokenId, seller, msg.sender, artwork.price);
    }

    // 取消销售
    function cancelSale(uint256 tokenId) public {
        require(_exists(tokenId), "Artwork does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only owner can cancel sale");

        artworks[tokenId].forSale = false;
        artworks[tokenId].price = 0;
    }

    // 提取合约余额（仅管理员）
    function withdrawFunds() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}



