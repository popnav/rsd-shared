const EventEmitter = require('events')
import { set, get } from 'idb-keyval';
import ClassParser from './ClassServiceParsing'

const NAMEPAIR_TYPES = [
    'class'
]

class ClassService extends EventEmitter {
    constructor() {
        super()
    }

    init(store) {
        // console.log("Init ClassService")
        this.$store = store

        this.namePair = {}
        ClassParser.init()
    }

    resetClasses() {
        this.classes = []

        this.namePair['class'] = []
    }

    // resetClassesExtended() {
    //     this.classesExtended = []
    // }

    resetClassFeatures() {
        this.classFeatures = []
    }

    loadClasses() {
        this.resetClasses()
        get('classes').then(val => {
            if (val) {
                this.classes = val
                    .filter(v => v.name != '[Empty Class]')
                    .filter(v => v.type === 'class')
                    //check for type due to quality of early sf2e data

                Object.keys(this.classes).forEach(k => {
                    this.classes[k] = ClassParser.parseClass(this.classes[k])
                })

                this.classes.sort((a, b) => a.name.localeCompare(b.name));

                this.emit('Set')

                this.loadClassPair()
            }
        })
    }

    // loadClassesExtended() {
    //     this.resetClassesExtended()
    //     get('classesExtened').then(val => {
    //         if (val) {
    //             this.classesExtended = val
    //             this.emit('ExtendedSet')
    //         }
    //     })
    // }

    loadClassFeatures() {
        this.resetClassFeatures()
        get('classFeatures').then(val => {
            if (val) {
                this.classFeatures = val
                this.emit('FeaturesSet')
            }
        })
    }

    loadClassPair() {
        let count = 0
        this.classes.forEach(b => {
            let pair = {
                name: b.name,
                id: b._id,
                type: 'class',
            }
            this.namePair['class'].push(pair)

            count += 1

            if (count == this.classes.length) {
                this.emit('ClassPairSet')
            }
        })
    }

    getClasses() {
        return this.classes
    }

    getNamePair(type) {
        if (type && NAMEPAIR_TYPES.includes(type))
            return this.namePair[type]
        else
            return null
    }

    // getClassesExtended() {
    //     return this.classesExtended
    // }

    getClassFeatures() {
        return this.classFeatures
    }

    getClass(id) {
        let found = null

        if (this.classes) {
            found = this.classes.find(b => {
                return b._id == id
            })
        }

        return found
    }

    // getClassExtended(id) {
    //     let found = null

    //     if (this.classesExtended) {
    //         found = this.classesExtended.find(b => {
    //             return b._id == id
    //         })
    //     }

    //     return found
    // }

    getClassFeature(id) {
        let found = null

        if (this.classFeatures) {
            found = this.classFeatures.find(b => {
                return b._id == id
            })
        }

        return found
    }

    getChoiceFeats(ids) {
        let found = []

        if (this.classFeatures) {
            found = this.classFeatures.filter(b => {
                return ids.includes(b._id)
            })
        }

        return found
    }
}

export default new ClassService();