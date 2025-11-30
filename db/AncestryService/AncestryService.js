const EventEmitter = require('events')
import { set, get } from 'idb-keyval';
import AncestryParser from './AncestryServiceParsing'

class AncestryService extends EventEmitter {
    constructor() {
        super()
    }

    init(store) {
        // console.log("Init AncestryService")
        this.$store = store
        AncestryParser.init()
    }

    resetAncestries() {
        this.ancestries = []
    }

    resetAncestryFeatures() {
        this.ancestryFeatures = []
    }

    loadAncestries() {
        this.resetAncestries()
        get('ancestries').then(val => {
            if (val) {
                this.ancestries = val
                    .filter(v => v.name != '[Empty Ancestry]')
                    .filter(v => v.type === 'ancestry')
                    //check for type due to quality of early sf2e data

                Object.keys(this.ancestries).forEach(k => {
                    this.ancestries[k] = AncestryParser.parseAncestry(this.ancestries[k])
                })

                this.ancestries.sort((a, b) => a.name.localeCompare(b.name));

                this.emit('Set')
            }
        })
    }

    loadAncestryFeatures() {
        this.resetAncestryFeatures()
        get('ancestryFeatures').then(val => {
            if (val) {
                this.ancestryFeatures = val
                this.emit('FeaturesSet')
            }
        })
    }

    getAncestries() {
        return this.ancestries
    }

    getAncestryFeatures() {
        return this.ancestryFeatures
    }

    parseAncestry(ancestry) {
        return AncestryParser.parseAncestry(ancestry)
    }

    getAncestry(id) {
        let found = null

        if (this.ancestries) {
            found = this.ancestries.find(b => {
                return b._id == id
            })
        }

        return found
    }

    getAncestryFeature(id) {
        let found = null

        if (this.ancestryFeatures) {
            found = this.ancestryFeatures.find(b => {
                return b._id == id
            })
        }

        return found
    }

    getAncestryFeatureByName(name) {
        let found = null

        if (this.ancestryFeatures) {
            found = this.ancestryFeatures.find(b => {
                return b.name == name
            })
        }

        return found
    }

    getHeritageByTraits(traits) {
        let found = []

        if (this.ancestryFeatures) {
            traits.push("versatile heritage")

            found = this.ancestryFeatures.filter(b => {
                let hasTrait = false
                traits.forEach(t => {
                    hasTrait = hasTrait || b.system.traits.value.includes(t)
                })
                return (hasTrait && b.system.featType.value == "heritage")
            })
        }

        return found
    }
}

export default new AncestryService();