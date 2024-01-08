import { default as hexer } from './hex.js'

// @ts-check
const select = document.querySelector('select')

/** @type {Map<string, WindowEventMap['eip6963:announceProvider']['detail']>} */
const wallets = new Map()

document.getElementById('json').addEventListener('keydown', async (event) => {
    const e = /** @type {HTMLElement & {value: string}} */ (event.currentTarget)
    if (event.key === 'ArrowRight' && e.value === '') {
        e.value = e.getAttribute('placeholder')
        event.preventDefault()
    }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey || event.altKey)) {
        event.preventDefault()
        send(e.value)
    }
})

/**
 * @param {object | string} json
 */
function send(json) {
    if (typeof json === 'string') json = (0, eval)(`(${json})`)
    const { info, provider } = wallets.get(select.value)
    const { name, img } = getNameAndImg(info.uuid)
    log(img(), name, ` request:`, json, ' => ', provider.request(json))
}

/**
 * @param {unknown[]} content
 */
function log(...content) {
    const container = document.createElement('div')
    container.append(new Date().toLocaleTimeString(), ' ')
    for (const e of content) {
        if (e instanceof Promise) {
            const span = document.createElement('span')
            const progress = document.createElement('md-circular-progress')
            progress.attributeStyleMap.set('--md-circular-progress-size', '32px')
            progress.setAttribute('indeterminate', 'true')
            span.append(progress)
            container.append(span)

            e.then(
                (result) => span.append(renderText(result)),
                (error) => span.append(String(error.message))
            ).finally(() => progress.remove())
        } else if (typeof e === 'string' || e instanceof Node) container.append(e)
        else container.append(renderText(e))
    }
    document.getElementById('log').insertBefore(container, document.getElementById('log').children[0])
}

async function sign() {
    const message = hexer(prompt('Enter message to sign'))
    const { info, provider } = wallets.get(select.value)
    const { name, img } = getNameAndImg(info.uuid)
    const [account] = await provider.request({
        method: 'eth_accounts',
    })
    log(
        img(),
        name,
        ` sign message:`,
        ' => ',
        provider.request({
            method: 'personal_sign',
            params: [message, account],
        })
    )
}

async function sendTransaction() {
    const to = prompt('Enter target to send', '0x16528fa4c634626393B931C98C0068421b50cF5E')
    const value = prompt('Enter how much ETH to send (hex)', '0xfffffffffffffff')
    const { provider } = wallets.get(select.value)
    const [account] = await provider.request({
        method: 'eth_accounts',
    })
    console.log(account)
    send({
        method: 'eth_sendTransaction',
        params: [
            {
                from: account,
                to,
                value,
            },
        ],
    })
}

async function connect() {
    const providerUUID = select.value
    const wallet = wallets.get(providerUUID)
    if (!wallet) return
    const { info, provider } = wallet

    const { name, img } = getNameAndImg(info.uuid)
    log(
        img(),
        name,
        ` wallet_requestPermissions(eth_accounts) =>`,
        provider.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }],
        })
    )
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
    select.appendChild(option)
    option.selected = true

    for (const e of document.querySelectorAll('[disabled]')) e.removeAttribute('disabled')

    if (info.uuid === 'f113ee3f-49e3-4576-8f77-c3991d82af41') document.getElementById('hint')?.remove()

    log(img(), name, ` ${info.uuid} discovered.`)

    globalThis.ethereum ??= provider
    const result = await provider.request({ method: 'wallet_getPermissions', params: [] })
    for (const permission of result) {
        if (permission.parentCapability === 'eth_accounts') {
            log(img(), name, ` wallet_getPermissions: `, permission)
        }
    }
    if (!result.length) log(img(), name)
})

/**
 * @param {string} uuid
 */
function getNameAndImg(uuid) {
    const info = wallets.get(uuid).info
    const img = document.createElement('img')
    Object.assign(img.style, { width: '1em', height: '1em', marginRight: '0.5em', marginTop: '-0.25em' })
    img.src = info.icon
    const name = `${info.name} (${info.rdns})`
    return { img: () => img.cloneNode(), name }
}

/**
 * @param {unknown} json
 */
function renderText(json) {
    if (typeof json === 'string') return json
    const e = document.createElement('wc-json-viewer')
    // @ts-ignore
    e.setConfig({ data: json })
    return e
}
Object.assign(window, {
    send,
    sign,
    connect,
    sendTransaction,
})
