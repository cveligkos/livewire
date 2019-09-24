import store from '@/Store'

class LoadingManager {
    constructor(component) {
        this.loadingElsByRef = {}
        this.loadingEls = []
        this.currentlyActiveLoadingEls = []
        this.component = component

        store.registerHook('elementInitialized', (el, component) => {
            if (component !== this.component) return

            if (el.directives.missing('loading')) return
            const directive = el.directives.get('loading')

            const refNames = el.directives.get('target')
                && el.directives.get('target').value.split(',').map(s => s.trim())

            this.addLoadingEl(
                el,
                directive.value,
                refNames,
                directive.modifiers.includes('remove')
            )
        })

        store.registerHook('messageSent', message => {
            this.setLoading(message.refs)
        })

        store.registerHook('messageFailed', () => {
            this.unsetLoading()
        })

        store.registerHook('responseReceived', () => {
            this.unsetLoading()
        })

        store.registerHook('elementRemoved', el => {
            this.removeLoadingEl(el)
        })
    }

    addLoadingEl(el, value, targetNames, remove) {
        if (targetNames) {
            targetNames.forEach(targetNames => {
                if (this.loadingElsByRef[targetNames]) {
                    this.loadingElsByRef[targetNames].push({el, value, remove})
                } else {
                    this.loadingElsByRef[targetNames] = [{el, value, remove}]
                }
            })
        } else {
            this.loadingEls.push({el, value, remove})
        }
    }

    removeLoadingEl(el) {
        this.loadingEls = this.loadingEls.filter(({el}) => ! el.isSameNode(node))

        if (el.ref in this.loadingElsByRef) {
            delete this.loadingElsByRef[el.ref]
        }
    }

    setLoading(refs) {
        const refEls = refs.map(ref => this.loadingElsByRef[ref]).filter(el => el).flat()

        const allEls = this.loadingEls.concat(refEls)

        allEls.forEach(el => {
            const directive = el.el.directives.get('loading')
            el = el.el.el // I'm so sorry @todo

            if (directive.modifiers.includes('class')) {
                // This is because wire:loading.class="border border-red"
                // wouldn't work with classList.add.
                const classes = directive.value.split(' ')

                if (directive.modifiers.includes('remove')) {
                    el.classList.remove(...classes)
                } else {
                    el.classList.add(...classes)
                }
            } else if (directive.modifiers.includes('attr')) {
                if (directive.modifiers.includes('remove')) {
                    el.removeAttribute(directive.value)
                } else {
                    el.setAttribute(directive.value, true)
                }
            } else {
                el.style.display = 'inline-block'
            }
        })

        this.currentlyActiveLoadingEls = allEls
    }

    unsetLoading() {
        this.currentlyActiveLoadingEls.forEach(el => {
            const directive = el.el.directives.get('loading')
            el = el.el.el // I'm so sorry @todo

            if (directive.modifiers.includes('class')) {
                const classes = directive.value.split(' ')

                if (directive.modifiers.includes('remove')) {
                    el.classList.add(...classes)
                } else {
                    el.classList.remove(...classes)
                }
            } else if (directive.modifiers.includes('attr')) {
                if (directive.modifiers.includes('remove')) {
                    el.setAttribute(directive.value)
                } else {
                    el.removeAttribute(directive.value, true)
                }
            } else {
                el.style.display = 'none'
            }
        })

        this.currentlyActiveLoadingEls = []
    }
}

export default LoadingManager