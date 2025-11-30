import { BestiaryService, isGM  } from '@/services'
import { DefaultController } from './DefaultController'
import { ELEMENT_TRAITS, ENERGY_DAMAGE_TYPES_TRAITS, SANCTIFICATION_TRAITS, ALIGNMENT_TRAITS } from '../constants/gametypes'

const ERRCODES = {
    0: 'B00', // Error: value is not valid, a string or longer than 0.
}

const skillsNames = [
    'acrobatics',
    'arcana',
    'athletics',
    'crafting',
    'deception',
    'diplomacy',
    'intimidation',
    'lore',
    'medicine',
    'nature',
    'occultism',
    'performance',
    'religion',
    'society',
    'stealth',
    'survival',
    'thievery',
]

export class BestiaryController extends DefaultController {
    constructor(isDev) {
        super(isDev)

        this._ref = []
        this._names = []

        console.log('BestiaryController: Initiating')

        BestiaryService.on('Set', () => { this._update() })
        BestiaryService.on('NamePairSet', () => { this._update() })
    }

    _update() {
        this._ref = BestiaryService.getRef()
        this._names = BestiaryService.getSearchNamePair()

        console.log('BestiaryController: Updating')
        
        this.emit('Update')
    }

    loadCustom(owner, repo) {
        if (!!owner && !!repo) {
            BestiaryService.loadCustomCreatures(owner, repo)
        }
    }
    flushCustom() {
        BestiaryService.flushCustomCreatures()
    }

    all() {
        return this._ref
    }

    names() {
        return this._names
    }

    get(bid) {
        return !!bid ? BestiaryService.getCreature(bid) : null
    }

    getName(bid) {
        let beast = this.get(bid)
        return !!beast && !!beast.name ? beast.name : null
    }

    getHP(bid, modifier = 0) {
        let beast = this.get(bid)
        let level = !!beast.system.details && !!beast.system.details.level && !!beast.system.details.level.value ? beast.system.details.level.value : null
        return !!beast && !!beast.system.attributes && !!beast.system.attributes.hp ? this._getModifiedHP(beast.system.attributes.hp.max, level, modifier) : null
    }

    getObject(bid, modifier = 0) {
        let beast = this.get(bid)
        let returnObject = null

        if (!!beast && !!beast.system) {
            // if (beast.name.toLowerCase() == 'stink-sap trap') {
            //     console.log(`${beast.name}`, beast)
            // }

            let level = !!beast.system.details && !!beast.system.details.level && !!beast.system.details.level.value ? beast.system.details.level.value : null
            returnObject = {
                _id: bid,
                name: this.getName(bid),
                level: level + (modifier/2),
                size: !!beast.system.traits.size.value ? this.$rsd.format.sizeBeautify(beast.system.traits.size.value) : null,
                rarity: !!beast.system.traits.rarity && beast.system.traits.rarity != "common" ? beast.system.traits.rarity : null,
                traits: !!beast.system.traits.value ? beast.system.traits.value : null,
                source: !!beast.system.details && !!beast.system.details.source && !!beast.system.details.source.value ? beast.system.details.source.value : 
                (!!beast.system.source && !!beast.system.source.value ? beast.system.source.value : null),
                perception: !!beast.system.perception && !!beast.system.perception.mod
                ? {value: beast.system.perception.mod + modifier} : null,
                stealth: !!beast.system.attributes.stealth && !!beast.system.attributes.stealth.value 
                ? beast.system.attributes.stealth.value + modifier : null,
                senses:  !!beast.system.traits.senses && !!beast.system.traits.senses.value
                ? this._getSenses(beast) : null,
                languages: !!beast.system.details.languages && !!beast.system.details.languages.value
                ? beast.system.details.languages.value : null,
                core: !!beast.system.abilities ? beast.system.abilities : null,
                hpmax: !!beast.system.attributes && !!beast.system.attributes.hp ? {value: this._getModifiedHP(beast.system.attributes.hp.max, level, modifier)} : null,
                hpinfo: !!beast.system.traits
                ? this._getHealthInfo(beast) : null,
                actions: {
                    defensive: !!beast.items ? this._getDefensive(beast.items) : null,
                    offensive: !!beast.items ? this._getOffensive(beast.items) : null,
                    interaction: !!beast.items ? this._getInteraction(beast.items) : null,
                    attacks: !!beast.items ? this._getAttacks(beast.items, modifier) : null,
                },
                speeds: !!beast.system.attributes && !!beast.system.attributes.speed ? this._getSpeeds(beast) : null,
                saves: {
                    ac: {
                        value: !!beast.system.attributes && !!beast.system.attributes.ac && !!beast.system.attributes.ac.value ? beast.system.attributes.ac.value : null
                    },
                    fortitude: {
                        value: !!beast.system.saves && !!beast.system.saves.fortitude && !!beast.system.saves.fortitude.value ? beast.system.saves.fortitude.value : null
                    },
                    reflex: {
                        value: !!beast.system.saves && !!beast.system.saves.reflex && !!beast.system.saves.reflex.value ? beast.system.saves.reflex.value : null
                    },
                    will: {
                        value: !!beast.system.saves && !!beast.system.saves.will && !!beast.system.saves.will.value ? beast.system.saves.will.value : null
                    }
                },
                skills: !!beast.items ? this._getSkills(beast.items, false, modifier) : null,
            }

            if (!!beast.system.resources) {
                if (!!beast.system.resources.focus) {
                    returnObject.focuspoints = beast.system.resources.focus.max
                }
            }

            if (beast.type == 'hazard') {
                if (!!beast.system && !!beast.system.details) {
                    returnObject.disable = !!beast.system.details.parsedDisable ? beast.system.details.parsedDisable : null
                    returnObject.complex = !!beast.system.details.isComplex
                    returnObject.reset = !!beast.system.details.parsedReset ? beast.system.details.parsedReset : null
                    returnObject.routine = !!beast.system.details.parsedRoutine ? beast.system.details.parsedRoutine : null
                }
            }

            let spellCasting = !!beast.items ? this._getSpellcasting(beast.items, modifier) : null
            if (!!spellCasting) {
                returnObject.spellcasting = spellCasting
            }

        }

        return !!returnObject ? returnObject : null

        // console.log(returnObject)
    }

    getSaveObject(bid) {
        let beast = this.get(bid)
        let returnObject = null

        if (!!beast && !!beast.system) {
            
            returnObject = {
                adj: 'normal',
                bid: bid,
                id: this.$rsd.random.getRandomUID(20),
                initiative: this.getInitiative(beast),
                hp: this.getHP(bid),
                name: beast.name,
                type: 'npc',
            }
        }

        return returnObject
    }

    getStats(bid, modifier = 0) {
        let beast = this.get(bid)
        let returnObject = null

        if (!!beast && !!beast.system) {
            let level = !!beast.system.details && !!beast.system.details.level && !!beast.system.details.level.value ? beast.system.details.level.value : null
            returnObject = {
                ac: !!beast.system.attributes && !!beast.system.attributes.ac && !!beast.system.attributes.ac.value ? beast.system.attributes.ac.value + modifier : null,
                maxhp: !!beast.system.attributes && !!beast.system.attributes.hp && !!beast.system.attributes.hp.max ? this._getModifiedHP(beast.system.attributes.hp.max, level, modifier) : null,
                perception: !!beast.system.perception && !!beast.system.perception.mod ? beast.system.perception.mod + modifier : null,
                saves: [
                    !!beast.system.saves && !!beast.system.saves.fortitude && !!beast.system.saves.fortitude.value ? beast.system.saves.fortitude.value + modifier : null,
                    !!beast.system.saves && !!beast.system.saves.reflex && !!beast.system.saves.reflex.value ? beast.system.saves.reflex.value + modifier : null,
                    !!beast.system.saves && !!beast.system.saves.will && !!beast.system.saves.will.value ? beast.system.saves.will.value + modifier : null,
                ],
                skills: !!beast.items ? this._getSkills(beast.items, true, modifier) : null,
                speed: !!beast.system.attributes.speed && !!beast.system.attributes.speed.value ? Number(beast.system.attributes.speed.value) : null,
            }

            if (!!beast.system.attributes.speed && !!beast.system.attributes.speed.otherSpeeds && !!beast.system.attributes.speed.otherSpeeds.length > 0) {
                returnObject.otherspeed = {}
                beast.system.attributes.speed.otherSpeeds.forEach(otherSpeed => {
                    if (!!otherSpeed && !!otherSpeed.type && !!otherSpeed.value) {
                        returnObject.otherspeed[otherSpeed.type] = Number(otherSpeed.value)
                    }
                })
            }
        }

        return !!returnObject ? returnObject : null
    }

    getInitiative(beast) {
        if (!!beast && !!beast.system) {
            let initiativeBonus = 0;
            if (!!beast.system.attributes && !!beast.system.perception && !!beast.system.perception.mod) {
                initiativeBonus = Number(beast.system.perception.mod);
            } else if (!!beast.system.attributes && !!beast.system.attributes.stealth && !!beast.system.attributes.stealth.value) {
                initiativeBonus = Number(beast.system.attributes.stealth.value);
            }

            const initiative = Math.max(0, Math.floor(Math.random() * 20 + 1 + initiativeBonus))

            return initiative
        } else {
            return 0
        }
    }

    _getSpeeds(beast) {
        let speeds = {
            movement: !!beast.system.attributes.speed.value ? Number(beast.system.attributes.speed.value) : null,
            details: !!beast.system.attributes.speed.details ? beast.system.attributes.speed.details : null,
            other: {}
        }
        if (!!beast.system.attributes.speed.otherSpeeds && !!beast.system.attributes.speed.otherSpeeds.length > 0) {
            beast.system.attributes.speed.otherSpeeds.forEach(otherSpeed => {
                if (!!otherSpeed && !!otherSpeed.type && !!otherSpeed.value) {
                    speeds.other[otherSpeed.type] = Number(otherSpeed.value)
                }
            })
        }
        return speeds
    }

    _getAttacks(items, modifier = 0) {
        if (modifier == 0) {
            return items.filter(i => i.type == 'melee')
        } else {
            const array = JSON.parse(JSON.stringify(items.filter(i => i.type == 'melee')))
            let attacks = [...array]
            attacks.forEach((value, index) => {
                if (!!value && !!value.system) {
                    if (!!value.system.bonus && (!!value.system.bonus.value || value.system.bonus.value == 0)) {
                        value.system.bonus.value = array[index].system.bonus.value + modifier
                    }

                    if (!!value.system.damageRolls && Object.keys(value.system.damageRolls).length > 0) {
                        Object.keys(value.system.damageRolls).forEach(dkey => {
                            value.system.damageRolls[dkey].damage = array[index].system.damageRolls[dkey].damage + '+' + modifier.toString()
                        })
                    }
                }
            })
            return attacks
        }
    }

    _getDefensive(items) {
        return items.filter(i => i.type == 'action' && i.system.category == 'defensive')
    }

    _getOffensive(items) {
        return items.filter(i => i.type == 'action' && i.system.category == 'offensive')
    }

    _getInteraction(items) {
        return items.filter(i => i.type == 'action' && (i.system.category == 'interaction' || i.system.category == null))
    }

    _getSpellcasting(items, modifier = 0) {
        if (modifier == 0) {
            let spellcastingEntries = items.filter(i => i.type == 'spellcastingEntry')
            let spells = items.filter(i => i.type == 'spell')
            
            return !!spellcastingEntries && spellcastingEntries.length > 0
            ? {entries: spellcastingEntries, spells: !!spells && spells.length > 0 ? spells : []} : null
        } else {
            const array = JSON.parse(JSON.stringify(items.filter(i => i.type == 'spellcastingEntry')))
            let spells = items.filter(i => i.type == 'spell')

            let spellcastingEntries = [...array]

            if (!!spellcastingEntries && Object.keys(spellcastingEntries).length > 0) {
                spellcastingEntries.forEach((value, index) => {
                    if (!!value && !!value.system) {
                        if (!!value.system.spelldc) {
                            if ((!!value.system.spelldc.dc || value.system.spelldc.dc == 0)) {
                                value.system.spelldc.dc = array[index].system.spelldc.dc + modifier
                            }
                            if ((!!value.system.spelldc.value || value.system.spelldc.value == 0)) {
                                value.system.spelldc.value = array[index].system.spelldc.value + modifier
                            }
                        }
                    }
                })
            }

            return !!spellcastingEntries && spellcastingEntries.length > 0 && !!spells && spells.length > 0 
            ? {entries: spellcastingEntries, spells: spells} : null
        }
    }

    _getSkills(items, flat = false, modifier = 0) {
        const loreitems = items.filter(i => i.type == 'lore')
        let skills = null

        if (!!flat) {
            skills = []
            skillsNames.forEach((name, index) => {
                skills.push(0)
            })
        } else {
            skills = {}
            skillsNames.forEach(name => {
                skills[name] = {value: 0}
            })
        }

        loreitems.forEach(item => {
            if (!!item && !!item.system && !!item.system.mod && !!item.system.mod.value && skillsNames.includes(item.name.toLowerCase())) {
                if (!!flat) {
                    const index = skillsNames.findIndex(sn => sn == item.name.toLowerCase())
                    skills[index] = item.system.mod.value + modifier
                } else {
                    skills[item.name.toLowerCase()].value = item.system.mod.value + modifier
                }
            }
        })

        return skills
    }

    _getSenses(beast) {
        const senses = beast.system.traits.senses.value.split(', ')
        let sensesArray = new Array(senses.length)

        senses.forEach((senseValue, senseIndex) => {
            let senseItem = this._getItemByName(beast.items, senseValue)
            if (!!senseItem) {
                sensesArray[senseIndex] = {
                    name: senseValue,
                    title: senseItem.name,
                    description: !!senseItem.system.description && !!senseItem.system.description.value ? senseItem.system.description.value : null
                }
            } else {
                sensesArray[senseIndex] = {
                    name: senseValue
                }
            }
        })

        return sensesArray
    }

    getHealthInfo(bid) {
        const beast = !!bid ? this.get(bid) : null
        return !!beast && !!beast.system ? this._getHealthInfo(beast) : null
    }

    _getHealthInfo(beast) {
        const immunities = !!beast.system.attributes.immunities ? beast.system.attributes.immunities : null
        const resistances = !!beast.system.attributes.resistances ? beast.system.attributes.resistances : null
        const weaknesses = !!beast.system.attributes.weaknesses ? beast.system.attributes.weaknesses : null

        return {
            immunities: !!immunities && immunities.length > 0 ? immunities : null,
            resistances: !!resistances && resistances.length > 0 ? resistances : null,
            weaknesses: !!weaknesses && weaknesses.length > 0 ? weaknesses : null,
        }
    }

    _getModifiedHP(hpmax, level, modifier) {
        if (modifier == 0) {
            return hpmax
        } else if (modifier > 0) {
            let adjustment = 10
            if (level >= 2 && level <= 4) {
                adjustment = 15
            } else if (level >= 5 && level <= 19) {
                adjustment = 20
            } else if (level >= 20) {
                adjustment = 30
            }
            
            return hpmax + adjustment
        } else {
            let adjustment = 0
            let modified = false
            if (level >= 1 && level <= 2) {
                adjustment = -10
                modified = true
            } else if (level >= 3 && level <= 5) {
                adjustment = -15
                modified = true
            }  else if (level >= 6 && level <= 20) {
                adjustment = -20
                modified = true
            } else if (level >= 21) {
                adjustment = -30
                modified = true
            }

            return hpmax + adjustment
        }
    }

    _getItemByName(items, name) {
        let returnItem = null
        Object.values(items).every((item) => {
            if (item.name.toLowerCase() == name.toLowerCase()) {
                returnItem = item
                return false
            }
            return true
        })
        return returnItem
    }

    //the creatureType isn't a thing any longer, since the remaster.
    //It's still nice to try to describe it to the user if possible.
    //We're giving this a shot: we make an attempt to determine the beast type based on traits that don't describe other
    //things like sanctification or alignment.
    getCreatureType(bid) {
        let allBeastTraits
        if (!!bid && typeof(bid) == 'string' && bid.length > 0)
            allBeastTraits = this.get(bid)?.system?.traits?.value
        if (!allBeastTraits)
            return null

        let beastTraits = []
        allBeastTraits.forEach(trait => {
            if (!ELEMENT_TRAITS.includes(trait)
                && !ENERGY_DAMAGE_TYPES_TRAITS.includes(trait)
                && !SANCTIFICATION_TRAITS.includes(trait)
                && !ALIGNMENT_TRAITS.includes(trait)
               )
               beastTraits.push(trait)
        })

        return beastTraits?.join(',')
    }

    _convertTypeArray(array) {
        let convert = null
        if (!!array && array.length > 0) {
            array.forEach(item => {
                if (!!item && !!item.type) {
                    if (!!convert) {
                        convert.push(item.type)
                    } else {
                        convert = [item.type]
                    }
                }
            })
        }
        return convert
    }
    _convertResistanceArray(array) {
        let convert = null
        if (!!array && array.length > 0) {
            array.forEach(item => {
                if (!!item && !!item.type) {
                    if (!!convert) {
                        convert.push(item.type)
                    } else {
                        convert = [item.type]
                    }
                }
            })
        }
        return convert
    }
}