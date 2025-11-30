import { EncounterBuilderService, isGM} from '@/services'
import { DefaultController } from './DefaultController'

const ERRCODES = {
    0: 'E00', // Error: encounter.name [${encounter.name}] is not of type string.
    1: 'E01', // Error: encounter.level [${encounter.level}] is not of type number.
    2: 'E02', // Error: encounter.partysize [${encounter.partysize}] is not of type number.
    3: 'E03', // Error: encounter [${encounter}] is not valid or empty.
    4: 'E04', // Error: EncounterMembers is not valid or no ids.
    5: 'E05', // Error: ID [${newID}] is not valid.
    6: 'E06', // Error: ID [${newID}] is not of type string or is empty.
    7: 'E07', // Error: newData.name [${newData.name}] is not of type string.
    8: 'E08', // Error: newData.color [${newData.color}] is not correct.
    9: 'E09', // Error: newData.icon [${newData.icon}] is not of type string.
    10: 'E10', // Error: newData.level [${newData.level}] is not of type number, or not between 1 and 20.
    11: 'E11', // Error: newData.partysize [${newData.partysize}] is not of type number, or not between 1 and 10.
    12: 'E12', // Error: newData [${newData}] is not of type object or is not valid.
    13: 'E13', // Error: partyid [${partyid}] is not valid or not of type string.
    14: 'E14', // Error: newIds [${newIds}] is not valid or is empty.
    15: 'E15', // Error: array [${array}] is not of type object or is empty.
    16: 'E16', // Error: array [${array}] is not of type object or is empty.
    17: 'E17', // Error: Not a GM.
    18: 'E18', // Error: Target is not valid.
    19: 'E19', // Error: newTarget [${newTarget}] is not valid or no a GM.
    20: 'E20', // Error: Encounter [${newEncounter}] is not valid.
    21: 'E21', // Error: key [${key}] or [${newData}] are not valid.
    22: 'E22', // Error: eid [${cid}] was not valid or empty.
    23: 'E23', // Error: id [${id}] was not valid or empty.
    24: 'E24', // Error: type of id [${id}] was not a number or string.
    25: 'E25', // Error: EncounterData is not valid, id [${id}] was not valid or no data was found.
    26: 'E26', // Error: key [${key}] or [${newData}] are not valid.
    27: 'E27', // Error: mid [${mid}] was not valid or empty.
    28: 'E28', // Error: id [${id}] was not valid or empty.
    29: 'E29', // Error: type of id [${id}] was not a number or string.
    30: 'E30', // Error: members is not valid, id [${id}] was not valid or no data was found.
}

const ENCOUNTER_SCALING = {
    name: '',
    totalxp: 0,
    level: 1,
    partysize: 4,
    difficultyScale: {
        trivial: 40,
        low: 60,
        moderate: 80,
        severe: 120,
        extreme: 160,
        deadly: 1000,
    },
    difficultyColor: {
        trivial: 'blue-grey lighten-4',
        low: 'cyan lighten-4',
        moderate: 'green lighten-4',
        severe: 'amber lighten-4',
        extreme: 'deep-orange lighten-4',
        deadly: 'grey lighten-1',
    },
    characterAdjustment: {
        trivial: 10,
        low: 15,
        moderate: 20,
        severe: 30,
        extreme: 40,
        deadly: 0,
    },
}

export class EncountersController extends DefaultController {
    constructor(isDev) {
        super(isDev)
    }

    /* Internal functions */

    _validEncounter(encounter) {
        if (!!encounter && !!encounter.name && !!encounter.level && !!encounter.partysize) {
            if (typeof(encounter.name) != 'string') {
                this.error(ERRCODES[0],`Error: encounter.name [${encounter.name}] is not of type string.`)
                return false
            }
            if (typeof(encounter.level) != 'number') {
                this.error(ERRCODES[1],`Error: encounter.level [${encounter.level}] is not of type number.`)
                return false
            }
            if (typeof(encounter.partysize) != 'number') {
                this.error(ERRCODES[2],`Error: encounter.partysize [${encounter.partysize}] is not of type number.`)
                return false
            }
            return true
        } else {
            this.error(ERRCODES[3],`Error: encounter [${encounter}] is not valid or empty.`)
            return false
        }
    }

    _geteid(id) {
        if (typeof(id) == 'number') {
            const cid = !!this.ids && id < this.ids.length ? this.ids[id] : null
            console.log('cid', cid, id, this.ids)
            if (!!cid) {
                const keys = Object.keys(cid)
                return !!keys && !!keys[0] ? keys[0] : null
            } else {
                this.error(ERRCODES[22],`Error: eid [${cid}] was not valid or empty.`)
                return null
            }
        } else if (typeof(id) == 'string') {
            if (!!id) {
                return id
            } else {
                this.error(ERRCODES[23],`Error: id [${id}] was not valid or empty.`)
                return null
            }
        } else {
            this.error(ERRCODES[24],`Error: type of id [${id}] was not a number or string.`)
            return null
        }
    }

    /* Getters */
    get activeKey() { return this.$store.getters['remotedb/encounterActiveKey'] }
    get active() { return this.$store.getters['remotedb/encounterActive'] }
    get ids() { return this.$store.getters['remotedb/encounterIds'] }
    get data() { return this.$store.getters['remotedb/encounterData'] }
    get members() { return this.$store.getters['remotedb/encounterMembersArray'] }

    get(id) {
        const eid = this._geteid(id)
        return !!eid && !!this.data && !!this.data[eid] ? this.data[eid] : null
    }

    getMemberKey(id) {
        if (typeof(id) == 'number') {
            const eid = !!this.members && id < this.members.length ? this.members[id] : null
            if (!!eid) {
                return id
            } else {
                this.error(ERRCODES[22],`Error: eid [${cid}] was not valid or empty.`)
                return null
            }
        } else if (typeof(id) == 'string') {
            if (!!id && !!this.members && this.members.length > 0) {
                const index = this.members.findIndex(a => a.id == id)
                const eid = index != -1 ? this.members[index] : null
                if (!!eid) {
                    return index
                } else {
                    this.error(ERRCODES[22],`Error: eid [${cid}] was not valid or empty.`)
                    return null
                }
            } else {
                this.error(ERRCODES[23],`Error: id [${id}] was not valid or empty.`)
                return null
            }
        } else {
            this.error(ERRCODES[24],`Error: type of id [${id}] was not a number or string.`)
            return null
        }
    }
    getMember(id) {
        const key = this.getMemberKey(id)
        return (!!key || key == 0) && !!this.members && !!this.members[key] ? this.members[key] : null
    }

    /* Setters */
    set activeKey(newID) {
        if (!!newID && typeof(newID) == 'string') {
            if (!!this.ids && !!this.includesKey(this.ids, newID)) {
                EncounterBuilderService.updateEncounterActive(newID)
            } else {
                this.error(ERRCODES[5],`Error: ID [${newID}] is not valid.`)
            }
        } else {
            this.error(ERRCODES[6],`Error: ID [${newID}] is not of type string or is empty.`)
        }
    }

    set active(newData) {
        if (!!newData && typeof(newData) == 'object') {
            if (!!this.active && !!this.activeKey) {
                if (!!newData.name && typeof(newData.name) != 'string') {
                    this.error(ERRCODES[7],`Error: newData.name [${newData.name}] is not of type string.`)
                    return
                }
                if (!!newData.color && typeof(newData.color) != 'object' && typeof(newData.color.a) == 'number'
                    && typeof(newData.color.r) == 'number' && typeof(newData.color.g) == 'number' && typeof(newData.color.b) == 'number') {
                    this.error(ERRCODES[8],`Error: newData.color [${newData.color}] is not correct.`)
                    return
                }
                if (!!newData.icon && typeof(newData.icon) != 'string') {
                    this.error(ERRCODES[9],`Error: newData.icon [${newData.icon}] is not of type string.`)
                    return
                }
                if (!!newData.level && newData.level >= 1 && newData.level <= 20 && typeof(newData.level) != 'number') {
                    this.error(ERRCODES[10],`Error: newData.level [${newData.level}] is not of type number, or not between 1 and 20.`)
                    return
                }
                if (!!newData.partysize && newData.partysize >= 1 && newData.partysize <= 10 && typeof(newData.partysize) != 'number') {
                    this.error(ERRCODES[11],`Error: newData.partysize [${newData.partysize}] is not of type number, or not between 1 and 10.`)
                    return
                }

                EncounterBuilderService.updateEncounterDataByID(this.activeKey, {
                    ...this.active,
                    name: !!newData.name ? newData.name.substr(0,30) : this.active.name,
                    color: !!newData.color ? newData.color : this.active.color,
                    icon: !!newData.icon ? newData.icon : this.active.icon,
                    level: !!newData.level ? newData.level : this.active.level,
                    partysize: !!newData.partysize ? newData.partysize : this.active.partysize
                })
            }
        } else {
            this.error(ERRCODES[12],`Error: newData [${newData}] is not of type object or is not valid.`)
        }
    }

    set target(newTarget) {
        if (!!newTarget && !!isGM) {
            this.$store.dispatch('rsd/setEncounterTarget', newTarget)
        } else {
            this.error(ERRCODES[19],`Error: newTarget [${newTarget}] is not valid or no a GM.`)
        }
    }

    setActive(partyid) {
        if (!!partyid && typeof(partyid) == 'string') {
            EncounterBuilderService.loadCurrentEncounterList(partyid)
        } else {
            this.error(ERRCODES[13],`Error: partyid [${partyid}] is not valid or not of type string.`)
        }
    }

    setArray(array) {
        if (!!array && typeof(array) == 'object' && array.length > 0) {
            if (!!this.ids) {
                let newIds = new Array(array.length)
                array.forEach((encounter, index) => {
                    newIds[index] = { [encounter._key]: true }
                })

                if (!!newIds && newIds.length >= 1) {
                    if (JSON.stringify(newIds) != JSON.stringify(this.ids)) {
                        this.$store.dispatch('remotedb/setEncounterList', {content: {ids: newIds}, instant: true})
                        EncounterBuilderService.updateEncounterIDs(newIds)
                    }
                } else {
                    this.error(ERRCODES[14],`Error: newIds [${newIds}] is not valid or is empty.`)
                }
            }
        } else {
            // Supressing this because it's not really usefull
            // this.warn(ERRCODES[15],`Error: array [${array}] is not of type object or is empty.`)
        }
    }

    setMembersArray(newArray, draggedObject = null) {
        if (!!newArray && typeof(newArray) == 'object' && newArray.length > 0) {
            if (!!this.members) {
                let filteredArray = []
                newArray.forEach(na => {
                    let fa = {
                        bid: na.bid,
                        id: na.id,
                        name: !!na.name && na.name != this.$rsd.bestiary.getName(na.bid) ? na.name : null,
                        initiative: na.initiative,
                        type: na.type,
                    }

                    if (!!na.adj) { fa.adj = na.adj }
                    if (!!na.color) { fa.color = na.color }

                    filteredArray.push(fa)
                })

                if (!!draggedObject) {
                    filteredArray = this._fixMembersArrayInitiative(filteredArray, draggedObject)
                }

                if (JSON.stringify(filteredArray) != JSON.stringify(this.members)) {
                    this.$store.dispatch('remotedb/setEncounterMembers', {content: {ids: filteredArray}, instant: true})
                    EncounterBuilderService.updateEncounterMembersIDs(filteredArray)
                }
            }
        } else {
            this.error(ERRCODES[16],`Error: array [${array}] is not of type object or is empty.`)
        }
    }

    /* Adders */
    addEncounter(newEncounter) {
        if (!!newEncounter && !!this._validEncounter(newEncounter)) {
            if (!!isGM) {
                EncounterBuilderService.addEncounter(newEncounter)
            } else {
                this.error(ERRCODES[17],`Error: Not a GM.`)
            }
        } else {
            this.error(ERRCODES[20],`Error: Encounter [${newEncounter}] is not valid.`)
        }
    }

    addMember(newBID) {
        if (!!newBID && (!this.members || (!!this.members && this.members.length < 20))) {
            const bestiary = this.$rsd.bestiary.get(newBID)

            if (!!bestiary && !!bestiary.system) {
                let initiativeBonus = 0;
                let npcLevel = !!bestiary.system.details && !!bestiary.system.details.level && !!bestiary.system.details.level.value ? bestiary.system.details.level.value : -1

                if (!!bestiary.system.attributes && !!bestiary.system.perception && !!bestiary.system.perception.mod) {
                    initiativeBonus = Number(bestiary.system.perception.mod);
                } else if (!!bestiary.system.attributes && !!bestiary.system.attributes.stealth && !!bestiary.system.attributes.stealth.value) {
                    initiativeBonus = Number(bestiary.system.attributes.stealth.value);
                }

                let initiative = Math.max(0, Math.floor(Math.random() * 20 + 1 + initiativeBonus))

                const newMember = {
                    adj: "normal",
                    bid: newBID,
                    id: this.$rsd.random.getRandomUID(20),
                    type: bestiary.type,
                    initiative: initiative,
                    xp: this.getNPCXP(npcLevel)
                }

                let newMembersArray = null
                if (!!this.members && this.members.length > 0) {
                    newMembersArray = this.members
                    newMembersArray.push(newMember)
                    newMembersArray = this._sortMembersArray(newMembersArray)
                } else {
                    newMembersArray = [newMember]
                }

                EncounterBuilderService.updateEncounterMembersIDs(newMembersArray)
            }
        }
    }

    /* Updaters */
    updateEncounter(id, newData) {
        const key = this._geteid(id)

        console.log(id, key, newData)
        if (!!key && !!newData) {
            const data = this.get(key)
            const updatedData = {...data, ...newData}
            if (!!isGM && !!data && !!updatedData && !!this._validEncounter(updatedData)) {
                EncounterBuilderService.updateEncounterDataByID(key, updatedData)
            } else {
                this.error(ERRCODES[17],`Error: Not a GM.`)
            }
        } else {
            this.error(ERRCODES[21],`Error: key [${key}] or [${newData}] are not valid.`)
        }
    }

    updateMember(id, newData, callback = null) {
        const key = this.getMemberKey(id)

        if (!!newData && (!!key || key == 0)) {
            const data = this.getMember(key)
            
            if (!!isGM && !!data) {
                const newMembers = this.members
                let mutatedData = {...data, ...newData}
                newMembers[key] = mutatedData

                // Calculate new XP if required
                if (!!newData.adj) {
                    const bestiary = this.$rsd.bestiary.get(data.bid)
                    let npcLevel = !!bestiary.system.details && !!bestiary.system.details.level && !!bestiary.system.details.level.value ? bestiary.system.details.level.value : -1
                    
                    if (newData.adj == 'weak') {
                        npcLevel -= 1
                    } else if (newData.adj == 'elite') {
                        npcLevel += 1
                    }

                    const newXP = this.getNPCXP(npcLevel)
                    mutatedData.xp = newXP
                    newMembers[key].xp = newXP
                }
                
                if (!!newData.initiative || newData.initiative == 0) {
                    if (!!this.members && this.members.length > 0) {
                        const newMembersArray = this._sortMembersArray(newMembers)
                        EncounterBuilderService.updateEncounterMembersIDs(newMembersArray, callback)
                    }
                } else {
                    EncounterBuilderService.updateEncounterMemberByIndex(key, mutatedData, callback)
                }
            } else {
                this.error(ERRCODES[17],`Error: Not a GM.`)
            }
        } else {
            this.error(ERRCODES[26],`Error: key [${key}] or [${newData}] are not valid.`)
        }
    }

    /* Deleters */
    remove(alert) {
    }

    removeEncounter(id, callback = null) {
        const eid = this._geteid(id)
        if (!!this.ids && !!eid) {
            EncounterBuilderService.removeEncounter(eid, callback)
        }
    }

    removeMember(id, callback = null) {
        const key = this.getMemberKey(id)

        if (!!this.members && (!!key || key == 0) && !!this.members[key]) {
            this.members.splice(key, 1)
            EncounterBuilderService.updateEncounterMembersIDs(this.members, callback)
        }
    }

    /* Functions */
    _fixMembersArrayInitiative(newArray, draggedObject) {
        if (!!newArray && newArray.length > 1 && !!draggedObject && !!draggedObject.id) {
            let newIndex = newArray.findIndex(na => na.id == draggedObject.id)

            if (newIndex != -1) {
                if (newIndex == 0) { // Is now start of the init list
                    newArray[newIndex].initiative = newArray[newIndex+1].initiative
                } else if (newIndex == newArray.length -1 ) { // Is now end of the init list
                    newArray[newIndex].initiative = newArray[newIndex-1].initiative
                } else { // Is now in the middle of the init list
                    newArray[newIndex].initiative = Math.floor((newArray[newIndex-1].initiative + newArray[newIndex+1].initiative)/2)
                }
            }
        }

        return newArray
    }

    _getValidArrayValue(array, index) {
        if (index >= 0 && index < array.length) {
            return array[index]
        } else {
            return null
        }
    }
    _previousArrayValue(array, index) {
        
    }

    _sortMembersArray(array) {
        return array.sort(this._compareInitiativeDesc)
    }

    _compareInitiativeDesc(a, b) {
        if (a.initiative > b.initiative) {
            return -1
        } else if (a.initiative == b.initiative) {
            return 0
        } else if (a.initiative < b.initiative) {
            return 1
        }
    }

    /* XP & Scaling functions */

    getNPCXP(npcLevel) {
        if (!!this.active) {
            const difference = npcLevel - this.active.level

            switch(difference) {
                case -4:
                    return 10
                case -3:
                    return 15
                case -2:
                    return 20
                case -1:
                    return 30
                case 0:
                    return 40
                case 1:
                    return 60
                case 2:
                    return 80
                case 3:
                    return 120
                case 4:
                    return 160
                default:
                    if (difference > 0) {
                        return 40 + (difference*20)
                    } else {
                        return 0
                    }
            }
        } else {
            return -1
        }
    }

    getDifficulty(encounter) {
        let difficulty = 'trivial'

        if (!!encounter) {
            const adjustedScale = this.getDifficultyScale(encounter)

            if (!!adjustedScale) {
                Object.keys(adjustedScale).every(s => {
                    if (encounter.totalxp <= adjustedScale[s]) {
                        difficulty = s
                        return false
                    }
                    return true
                })
            }
        }

        return difficulty
    }

    getDifficultyScale(encounter) {
        let difficultyScale = {...ENCOUNTER_SCALING.difficultyScale}

        if (!!encounter) {
            const characterOffset = encounter.partysize - 4

            if (characterOffset != 0) {
                Object.keys(difficultyScale).forEach(ds => {
                    difficultyScale[ds] += ENCOUNTER_SCALING.characterAdjustment[ds] * characterOffset
                })
            }
        }

        return difficultyScale
    }

    getDifficultyColor(encounter) {
        const difficulty = this.getDifficulty(encounter)
        return ENCOUNTER_SCALING.difficultyColor[difficulty]
    }
}