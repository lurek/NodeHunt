export const siteConfig = {
  name: 'NodeHunt',
  tagline: 'Discover the latest Web3 Nodes, DePIN, Crypto Infrastructure, AI x Blockchain, and Passive Earning Opportunities.',
  description: 'Research-led guides and analysis for Web3 nodes, DePIN, crypto infrastructure, wallet security, and AI x blockchain.',
  url: import.meta.env.PUBLIC_SITE_URL || 'https://nodehunt.example',
  postsPerPage: 12,
} as const;

export const navigation = [
  { label: 'Blog', href: '/blog/' },
  { label: 'Nodes', href: '/category/web3-nodes/' },
  { label: 'DePIN', href: '/category/depin/' },
  { label: 'Security', href: '/category/security/' },
  { label: 'AI x Crypto', href: '/category/ai-x-blockchain/' },
] as const;
