declare const Mask: undefined | typeof import('../mask/packages/mask-sdk/public-api/index.ts').Mask
interface Window {
    Mask?: typeof Mask
}
interface WindowEventMap {
    'eip6963:announceProvider': CustomEvent<
        import('../mask/packages/mask-sdk/dist/public-api/mask-wallet.d.ts').Ethereum.EIP6963ProviderDetail
    >
}
