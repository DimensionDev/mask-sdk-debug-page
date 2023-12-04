// @ts-check
const logContainer = document.getElementById('log')
const select = document.querySelector('select')
function log(...content) {
    const container = document.createElement('div')
    container.append(new Date().toLocaleTimeString(), ' ', ...content)
    logContainer.insertBefore(container, logContainer.children[0])
}
/** @type {Map<string, WindowEventMap['eip6963:announceProvider']['detail']>} */
const wallets = new Map()

async function connect() {
    const providerUUID = select.value
    const wallet = wallets.get(providerUUID)
    if (!wallet) return
    const { info, provider } = wallet

    const { name, img } = getNameAndImg(info.uuid)
    log(img(), name, ` request wallet_requestPermissions(eth_accounts)`)
    try {
        const permissions = await provider.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }],
        })
        log(img(), name, ` Approved permissions: `, JSON.stringify(permissions))
    } catch (error) {
        log(img(), name, ' ', error.message)
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.dispatchEvent(new Event('eip6963:requestProvider'))
})

window.addEventListener('eip6963:announceProvider', async (event) => {
    const { info, provider } = event.detail
    if (wallets.has(info.uuid)) return
    wallets.set(info.uuid, event.detail)

    const { name, img } = getNameAndImg(info.uuid)

    const option = document.createElement('option')
    option.innerText = name
    option.value = info.uuid
    select?.appendChild(option)
    option.selected = true

    document.getElementById('connect').removeAttribute('disabled')

    if (info.uuid === 'f113ee3f-49e3-4576-8f77-c3991d82af41') document.getElementById('hint')?.remove()

    log(img(), name, ` ${info.uuid} discovered.`)

    const result = await provider.request({ method: 'wallet_getPermissions', params: [] })
    for (const permission of result) {
        if (permission.parentCapability === 'eth_accounts') {
            log(img(), name, ` Approved permissions: `, JSON.stringify(permission))
        }
    }
    if (!result.length) log(img(), name)
})

function getNameAndImg(uuid) {
    const info = wallets.get(uuid).info
    const img = document.createElement('img')
    Object.assign(img.style, { width: '1em', height: '1em', marginRight: '0.5em', marginTop: '-0.25em' })
    img.src = info.icon
    const name = `${info.name} (${info.rdns})`
    return { img: () => img.cloneNode(), name }
}
