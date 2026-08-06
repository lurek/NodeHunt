---
title: 'Web3 Infrastructure Explained: The Systems Behind a Chain'
description: 'Nodes, validators, RPC providers, indexers, bridges, and wallets explained in one practical map of modern blockchain infrastructure.'
slug: web3-infrastructure-explained
publishedAt: 2026-07-10
draft: false
author: nodehunt-editorial
category: crypto-infrastructure
tags: [nodes, depin]
cover:
  image: '../../../assets/content/web3-network-globe.jpg'
  alt: 'Digital globe of connected network nodes, representing the layers of web3 infrastructure behind a blockchain'
  caption: 'Web3 infrastructure is the plumbing that connects chains, applications, and users: nodes, consensus, RPC, indexers, wallets, and bridges.'
featured: true
editorPick: true
trendingScore: 90
seo: { noindex: false }
sources: [{ label: ethereum.org developer documentation, url: https://ethereum.org/en/developers/docs/ }, { label: ethereum.org nodes and clients, url: https://ethereum.org/en/developers/docs/nodes-and-clients/ }, { label: ethereum.org JSON-RPC API, url: https://ethereum.org/en/developers/docs/apis/json-rpc/ }, { label: ethereum.org bridges, url: https://ethereum.org/en/developers/docs/bridges/ }, { label: The Graph indexer protocol, url: https://thegraph.com/ }, { label: EIP-1193 provider interface, url: https://eips.ethereum.org/EIPS/eip-1193 }]
---

A blockchain looks like a single system, but behind it sits a stack of separate pieces — nodes that store the ledger, validators that agree on it, RPC providers that answer application queries, indexers that organize the data, wallets that hold the keys, and bridges that connect networks. When you use a dApp, you are almost never talking to the chain itself; you are talking to this infrastructure. Understanding which layer does what makes it much easier to judge reliability, fees, and risk.

This guide maps that stack in plain terms. If you are still deciding whether to operate any of it yourself, our [guide to running a blockchain node](/articles/beginners-guide-to-running-nodes/) covers the hardware and responsibilities side, and our [guide to the best crypto nodes for beginners](/articles/best-crypto-nodes-for-beginners/) covers the projects-and-rewards side.

## What "infrastructure" actually means

In web3, infrastructure is the set of services that keeps a chain running and lets applications use it. Some of it is decentralized — thousands of independent nodes validating the same ledger. Some of it is centralized in practice — a handful of RPC providers or indexers serving most traffic. Both parts matter, and the difference between them is where most of the trust questions live.

## The execution layer: blocks, transactions, and state

At the bottom of the stack is the ledger itself. A blockchain groups transactions into blocks, chains them with cryptographic hashes, and keeps a shared **state** — account balances, contract code, and storage. Every node stores a copy of this history and keeps it in sync with its peers.

This layer is what most people mean when they say "the chain." It is where data lives and where transactions are processed. Everything above it exists to read or write to this shared state.

## Nodes: the backbone

A node is a computer running the network's software — for example Geth or Nethermind on Ethereum, or Bitcoin Core on Bitcoin. Nodes receive blocks, validate them against the rules of the protocol, relay data to peers, and maintain their own copy of the ledger. More independent nodes means more decentralization: the chain can survive losing any subset of them, and no single operator controls the truth.

<figure>
  <img src="https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1600&h=900&fit=crop&auto=format&q=80" alt="Server room with racks of machines running blockchain node software" width="1600" height="900" loading="lazy" />
  <figcaption>Full nodes store and relay the ledger. The more independent operators there are, the harder the network is to control.</figcaption>
</figure>

There are different node roles. A **full node** verifies every block and maintains current state; a **light node** stores only block headers and asks peers for data; an **archive node** keeps every historical state ever recorded. Each trades independence, disk space, and convenience differently — our [node running guide](/articles/beginners-guide-to-running-nodes/) compares them in detail.

## Consensus: how the chain agrees

Nodes need a rule to decide which version of history is canonical, because two blocks can race to the same height. That rule is **consensus**, and it is what turns thousands of independent machines into one coherent ledger.

Bitcoin and older networks use **proof of work**, where miners race to find a block hash and are rewarded for producing valid blocks. Modern Ethereum uses **proof of stake**, where validators lock up a stake (currently 32 ETH for a full validator) and are selected to propose and attest blocks. Validators who behave correctly earn rewards; those who break protocol rules can have their stake **slashed**. Consensus is the layer that makes fraud expensive and history hard to rewrite.

<aside class="callout" data-type="note" role="note">
  <p class="callout-title"><span class="callout-glyph" aria-hidden="true">i</span>Good to know</p>
  <div class="callout-body"><p>Users never interact with consensus directly. They trust that nodes and validators are doing this job correctly — which is why running your own node, or at least using one you trust, changes how much you rely on third parties.</p></div>
</aside>

## RPC providers: the API between apps and chains

Applications do not read the ledger directly. They call an **RPC endpoint** — a Remote Procedure Call interface that lets them ask for balances, blocks, and contract state, and submit signed transactions. Ethereum exposes this through its JSON-RPC API; wallets and browsers expose it to dApps through standardized interfaces such as EIP-1193.

RPC providers sit between your wallet and the chain. A provider like Infura, Alchemy, or a public endpoint relays your requests and broadcasts your signed transactions. They are convenient — running your own node is real work — but they create a dependency: the provider can see what you query, and if it goes down or censors, your app stops.

<figure>
  <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1600&h=900&fit=crop&auto=format&q=80" alt="Code editor on a laptop screen showing an API request to a blockchain RPC provider" width="1600" height="900" loading="lazy" />
  <figcaption>An RPC provider is the API bridge between applications and the chain — convenient, but a centralization point in practice.</figcaption>
</figure>

<aside class="callout" data-type="warning" role="note">
  <p class="callout-title"><span class="callout-glyph" aria-hidden="true">!</span>Watch out</p>
  <div class="callout-body"><p>A handful of providers serve a large share of wallet traffic. That concentration is a real failure risk: an outage, a policy change, or a compromise at one provider can disrupt a large number of users at once.</p></div>
</aside>

## Indexers: making the data queryable

Raw chain data is not easy to search. Blocks contain opaque transactions, and "find all transfers to this address" is a painful query if you must scan history yourself. **Indexers** ingest on-chain data and organize it into databases and query languages — The Graph is the best-known example, letting developers query indexed data with GraphQL. Block explorers such as Etherscan are built on the same idea.

Indexers make building and researching easier, but they are another trust boundary: you are trusting the indexer to have interpreted the data correctly. Most teams run their own subgraphs or indexers for anything mission-critical.

## Wallets: signing, not storing

A wallet does not hold your coins — it holds the **private keys** that authorize spending them. Wallets connect to an RPC provider to read balances and broadcast transactions, but the critical act happens locally: signing. The seed phrase derives your keys, and anyone with those keys controls the funds.

That is why wallet security is about key management, not about the app you happen to use. The threat model — seed phrases, phishing, malicious approvals, device hygiene — is covered end to end in our [guide to securing your crypto wallet](/articles/how-to-secure-your-crypto-wallet/), and it applies whether you use a browser extension or a hardware device.

## Bridges: moving across networks

A bridge lets assets or messages travel from one chain to another. The mechanics are usually lock-and-mint (funds are locked on the source chain and a representation is minted on the destination) or burn-and-mint (the representation is burned so the original can be unlocked). Some bridges are more decentralized — using light clients or relayers with economic security — while others rely on a small set of signers.

<aside class="callout" data-type="danger" role="note">
  <p class="callout-title"><span class="callout-glyph" aria-hidden="true">!</span>Stop and verify</p>
  <div class="callout-body"><p>Bridges concentrate value in a contract that multiple parties must protect, and bridge exploits have historically produced some of the largest DeFi losses. Before moving funds across a bridge, check who secures it, whether it is audited, and what the process is for a failure.</p></div>
</aside>

## How the layers fit together

When you send a transaction, the request moves through most of the stack in order:

<div class="table-region" role="region" aria-label="Web3 infrastructure layers explained" tabindex="0">
  <table>
    <caption>Layer by layer: what runs, and what can go wrong</caption>
    <thead><tr><th scope="col">Layer</th><th scope="col">Who runs it</th><th scope="col">What it does</th><th scope="col">Failure mode</th></tr></thead>
    <tbody><tr><td><strong>Nodes</strong></td><td>Independent operators</td><td>Store and validate the ledger</td><td>Concentration of node operators</td></tr><tr><td><strong>Consensus</strong></td><td>Miners or validators</td><td>Agree on the canonical chain</td><td>Validator centralization, slashing</td></tr><tr><td><strong>RPC providers</strong></td><td>Commercial services</td><td>Answer queries, relay transactions</td><td>Outages, censorship, surveillance</td></tr><tr><td><strong>Indexers</strong></td><td>Protocols and teams</td><td>Organize on-chain data for queries</td><td>Incorrect or incomplete indexing</td></tr><tr><td><strong>Wallets</strong></td><td>You</td><td>Hold keys and sign transactions</td><td>Phishing, compromised devices</td></tr><tr><td><strong>Bridges</strong></td><td>Bridge operators</td><td>Move assets and messages between chains</td><td>Smart-contract risk, key custody</td></tr></tbody>
  </table>
</div>

The pattern to notice: the decentralized layers (nodes, consensus) are where the security model lives, while the convenient layers (RPC, indexers, many bridges) are where trust in a third party sneaks back in.

<figure>
  <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&h=900&fit=crop&auto=format&q=80" alt="Infrastructure team working on laptops while managing blockchain network services" width="1600" height="900" loading="lazy" />
  <figcaption>Teams that build on a chain usually outsource the boring layers and keep the security-critical ones under their own control.</figcaption>
</figure>

## Self-hosted vs outsourced infrastructure

<div class="proscons">
  <section class="proscons-col"><h3>Self-hosted</h3><ul><li>No third party between you and the chain</li><li>Full control over uptime, data, and queries</li><li>Contributes directly to decentralization</li></ul></section>
  <section class="proscons-col"><h3>Outsourced</h3><ul><li>Fast to set up and scale on demand</li><li>Cheaper for small or experimental workloads</li><li>You trust a provider for availability and access</li></ul></section>
</div>

A sensible default for most teams is a mix: run a node where the data is sensitive, outsource RPC and indexing where convenience wins, and always hold the keys yourself. This is exactly the tradeoff DePIN networks make too — real-world infrastructure projects like decentralized broadband and web-scraping networks lean on node operators, which is why our [guide to researching DePIN projects](/articles/how-to-research-depin-projects/) treats hardware and operator incentives as first-class factors.

## Trust checklist before you build or use

- **Who answers your RPC?** If it is a single provider, plan for an outage and keep a fallback.
- **Who secures the bridge?** Check custody model, audits, and past incidents before moving real value.
- **Who holds the keys?** You, or someone else? The answer defines the security model.
- **Can you verify the data?** Cross-check indexer results against the chain when the data matters.
- **What happens at scale?** Test against your own node before you depend on free public endpoints.

## FAQ

<dl class="faq">
  <div class="faq-item"><dt>Is running your own node worth it for an application?</dt><dd>Yes, for anything where a provider outage or a disputed data point would hurt you. A full node removes the biggest centralization dependency and lets you verify what the RPC returns. It costs hardware, bandwidth, and maintenance, as covered in our node guide.</dd></div>
  <div class="faq-item"><dt>Do I need my own node just to use a wallet?</dt><dd>No. Wallets work fine over public or commercial RPC endpoints. You only gain independence by running a node; you do not need one to sign transactions or check balances.</dd></div>
  <div class="faq-item"><dt>Are RPC providers the same as the blockchain?</dt><dd>No. RPC providers are applications' gateway to the chain. They relay queries and broadcast signed transactions, but they do not create consensus or custody your keys. A provider going down affects its users, not the chain itself.</dd></div>
  <div class="faq-item"><dt>Why are bridge hacks so common?</dt><dd>Bridges hold large amounts of value behind a contract that many actors must protect, and the trust assumptions between chains are complicated. When a bridge fails, it is usually a custody or smart-contract problem, not a problem with the chains themselves.</dd></div>
  <div class="faq-item"><dt>What role does an indexer play?</dt><dd>An indexer reads raw chain data and organizes it into queryable form. It makes building faster and explorers possible, but it is a trust boundary: you assume the indexer interpreted the data correctly, so verify results you depend on.</dd></div>
</dl>

## Bottom line

Web3 infrastructure is a stack, not a monolith: nodes and consensus provide the security, while RPC providers, indexers, wallets, and bridges handle convenience. Each layer introduces its own trust question, and the reliable projects are the ones that know which layers they control and which they outsource. Start by running your own node for the parts that matter, hold your own keys, and treat every third-party service as a dependency with a failure mode. Browse the [crypto-infrastructure category](/category/crypto-infrastructure/) and the [node tag archive](/tag/nodes/) for deeper dives into each layer.

*This article is for educational purposes only and should not be considered financial or investment advice. Always conduct your own research (DYOR) before investing in cryptocurrencies or blockchain projects.*
