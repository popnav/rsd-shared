import { CombatService, CampaignService, isGM} from '@/services'
import { DefaultController } from './DefaultController'

import auth from '@root/.shared/services/AuthService'

const ERRCODES = {
    0: 'M00', // Error: Not a GM.
    1: 'M01', // Error: newAlert [${newAlert}] is not valid.
    2: 'M02', // Error: id [${id}] was not valid or empty.
    3: 'M03', // Error: gmcId [${gmcId}] is not valid, GMCStats is not valid or no stats found by that id.
    4: 'M04', // Error: GMCList is not valid or no ids.
    5: 'M05', // Error: mid [${mid}] is not valid.
    6: 'M06', // Error: index [${index}] is -1 or member with that index is not found.
    7: 'M07', // Error: gmc [${gmc}] is not valid or empty.
    8: 'M08', // Error: gmc.name [${gmc.name}] is not of type string.
    9: 'M09', // Error: gmc.maxhp [${gmc.maxhp}] is not of type number.
    10: 'M10', // Error: gmc.ac [${gmc.ac}] is not of type number.
    11: 'M11', // Error: key [${key}] not valid, PCStats not valid or no such stat.
    12: 'M12', // Error: key [${key}] not valid, GMCStats not valid or no such stat.
    13: 'M13', // Error: type [${type}] is not valid or not of type string.
    14: 'M14', // Error: newTarget [${newTarget}] is not valid or no a GM.
    15: 'M15', // Error: mid [${mid}] was not valid or empty.
    16: 'M16', // Error: id [${id}] was not valid or empty.
    17: 'M17', // Error: type of id [${id}] was not a number or string.
    18: 'M18', // Error: key [${key}] or [${newData}] are not valid.
    19: 'M19', // Error: charData [${charData}] is not valid.
    20: 'M20', // Error: condition.type [${condition.type}] is not of type string.
    21: 'M21', // Error: condition.name [${condition.name}] is not of type string.
    22: 'M22', // Error: condition.duration [${condition.duration}] is not of type number.
    23: 'M23', // Error: condition.value [${condition.value}] is not of type number.
    24: 'M24', // Error: condition [${condition}] is not valid or empty.
    25: 'M25', // Error: data [${data}] is not valid.
}

const CORE_NAMES = [
    'str',
    'dex',
    'con',
    'int',
    'wis',
    'cha',
]

const ABILITY_SCORE_NAMES = [
    'strength','dexterity','constitution','intelligence','wisdom','charisma'
]

const DEFAULT_CORE = [10,10,10,10,10,10]
const DEFAULT_SKILLS = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
const DEFAULT_SAVES = [0,0,0]

export class MembersController extends DefaultController {
    constructor(isDev) {
        super(isDev)
    }

    /* Internal functions */

    // TODO: Expand check
    _validGMC(gmc) {
        if (!!gmc && !!gmc.name && !!gmc.maxhp && !!gmc.ac) {
            if (typeof(gmc.name) != 'string') {
                this.error(ERRCODES[8],`Error: gmc.name [${gmc.name}] is not of type string.`)
                return false
            }
            if (typeof(gmc.maxhp) != 'number') {
                this.error(ERRCODES[9],`Error: gmc.maxhp [${gmc.maxhp}] is not of type number.`)
                return false
            }
            if (typeof(gmc.ac) != 'number') {
                this.error(ERRCODES[10],`Error: gmc.ac [${gmc.ac}] is not of type number.`)
                return false
            }
            // if (!!gmc.title && typeof(gmc.title) != 'string') {
            //     this.error(ERRCODES[4],`Error: gmc.title [${gmc.title}] is not of type string.`)
            //     return false
            // }
            // if (typeof(gmc.remove) != 'boolean') {
            //     this.error(ERRCODES[5],`Error: gmc.remove [${gmc.remove}] is not of type boolean.`)
            //     return false
            // }
            return true
        } else {
            this.error(ERRCODES[7],`Error: gmc [${gmc}] is not valid or empty.`)
            return false
        }
    }

    _getmid(id) {
        if (typeof(id) == 'number') {
            const gid = !!this.gmc && id <= this.gmc.length ? this.gmc[id] : null
            const pid = !!this.pc && id <= this.pc.length ? this.pc[id] : null
            
            if (!!gid || !!pid) {
                return id
            } else {
                this.error(ERRCODES[15],`Error: mid was not valid or empty.`)
                return null
            }
        } else if (typeof(id) == 'string') {
            if (!!id) {
                const gid = !!this.gmc ? this.gmc.findIndex(g => g._key == id) : null
                const pid = !!this.pc ? this.pc.findIndex(p => p._key == id) : null

                return (!!gid || gid == 0) && gid != -1 ? gid : ((!!pid || pid == 0) && pid != -1 ? pid : null)
            } else {
                this.error(ERRCODES[16],`Error: id [${id}] was not valid or empty.`)
                return null
            }
        } else {
            this.error(ERRCODES[17],`Error: type of id [${id}] was not a number or string.`)
            return null
        }
    }

    _validmid(id) {
        if (typeof(id) == 'number') {
            const gid = !!this.gmc && id <= this.gmc.length ? this.gmc[id] : null
            const pid = !!this.pc && id <= this.pc.length ? this.pc[id] : null
            
            if (!!gid || !!pid) {
                return true
            } else {
                this.error(ERRCODES[15],`Error: mid was not valid or empty.`)
                return null
            }
        } else if (typeof(id) == 'string') {
            if (!!id) {
                const gid = !!this.gmc ? this.gmc.findIndex(g => g._key == id) : null
                const pid = !!this.pc ? this.pc.findIndex(p => p._key == id) : null

                return (!!gid || gid == 0) && gid != -1 ? true : ((!!pid || pid == 0) && pid != -1 ? true : null)
            } else {
                this.error(ERRCODES[16],`Error: id [${id}] was not valid or empty.`)
                return null
            }
        } else {
            this.error(ERRCODES[17],`Error: type of id [${id}] was not a number or string.`)
            return null
        }
    }

    _validCondition(condition) {
        if (!!condition && !!condition.type) {
            if (typeof(condition.type) != 'string') {
                this.error(ERRCODES[20],`Error: condition.type [${condition.type}] is not of type string.`)
                return false
            }
            if (!!condition.name && typeof(condition.name) != 'string') {
                this.error(ERRCODES[21],`Error: condition.name [${condition.name}] is not of type string.`)
                return false
            }
            if (!!condition.duration && typeof(condition.duration) != 'number') {
                this.error(ERRCODES[22],`Error: condition.duration [${condition.duration}] is not of type number.`)
                return false
            }
            if (!!condition.value && typeof(condition.value) != 'number') {
                this.error(ERRCODES[23],`Error: condition.value [${condition.value}] is not of type number.`)
                return false
            }
            return true
        } else {
            this.error(ERRCODES[24],`Error: condition [${condition}] is not valid or empty.`)
            return false
        }
    }

    /* Getters */
    get target() { return this.$store.getters['rsd/partyTarget'] }
    get all() { return this.$store.getters['remotedb/membersArray'] }
    get gmc() { return this.$store.getters['remotedb/gmcArray'] }
    get pc() { return this.$store.getters['remotedb/pcArray'] }
    get characterData() { return this.$store.getters['remotedb/characterData'] }
    get membersConditions() { return this.$store.getters['remotedb/combatMembersConditions'] }

    getGMC(id) {
        const mid = this._getmid(id)
        return (!!mid || mid == 0) && !!this.gmc && !!this.gmc[mid] ? this.gmc[mid] : null
    }
    getPC(id) {
        const mid = this._getmid(id)
        return (!!mid || mid == 0) && !!this.pc && !!this.pc[mid] ? this.pc[mid] : null
    }
    get(id, type) {
        if ((!!id || id == 0) && !!type) {
            return type == 'pc' ? this.getPC(id) : this.getGMC(id)
        } else {
            return null
        }
    }
    getCharData(id) {
        return !!id && !!this.characterData && !!this.characterData[id] ? this.characterData[id] : null
    }
    getConditions(id) {
        return !!id && !!this.membersConditions && !!this.membersConditions[id] ? this.membersConditions[id] : null
    }

    getMembersArray() {
        let originalArray = this.$store.getters['remotedb/membersArray']

        if (!!originalArray && originalArray.length > 0) {
            originalArray.forEach((member, index) => {
                const basestats = this.$rsd.members.getStats(member)
                const object = this.$rsd.members.getObject(member)
                const stats = this.$rsd.conditions.getStatsObject(member, basestats, member.conditions, object)

                originalArray[index] = {
                    ...member,
                    basestats: basestats,
                    name: member.name,
                    identifier: this.$rsd.combat.getIdentifier(member, object),
                    object: object,
                    stats: stats,
                    _key: index,
                }
            })
        }

        return originalArray
    }

    getObject(combatant) {
        let object = null
        if (!!combatant && !!combatant.id && !!combatant.type) {
            const member = this.get(combatant.id, combatant.type)

            if (!!member) {

                object = {
                    adv: combatant.type == 'gmc' || (combatant.type == 'pc' && !!member.adv),
                    level: !!member.level ? member.level : 1,
                    name: !!member.name ? member.name : '',
                    rarity: 'unique',
                    size: !!member.size ? member.size : 'medium',
                    traits: ['humanoid'], // TODO add ancestry
                    languages: ['common'], // TODO add languages
                    core: !!member.scores ? this.getCore(member.scores, CORE_NAMES) : this.getCore(DEFAULT_CORE, CORE_NAMES),
                    speeds: !!member.speed ? {movement: member.speed, other:{}} : {movement: 25, other:{}}, // TODO add other speeds
                    icon: !!member.icon ? member.icon : null,
                    color: !!member.color ? member.color : null,
                }

                if (!!object.adv) { object.traits.push('advanced') } else { object.traits.push('basic') }

                if (!!member.abc) {
                    const a = !!member.abc.a ? this.$rsd.build.getAncestry(member.abc.a) : null
                    const b = !!member.abc.b ? this.$rsd.build.getBackground(member.abc.b) : null
                    const c = !!member.abc.c ? this.$rsd.build.getClass(member.abc.c) : null

                    object.abc = {
                        a: !!a ? a.name : null,
                        b: !!b ? b.name : null,
                        c: !!c ? c.name : null
                    }
                }
            }
        }
        return object
    }

    getStats(combatant, nonMod = false) {
        let object = null

        if (!!combatant && !!combatant.id && !!combatant.type) {
            const member = this.get(combatant.id, combatant.type)

            if (!!member) {
                object = {
                    ac: !!member.ac ? member.ac : 10,
                    level: !!member.level ? member.level : 1,
                    maxhp: !!member.maxhp ? member.maxhp : 1,
                    perception: !!member.perception ? member.perception : 0,
                    saves: !!member.saves ? member.saves : [0,0,0],
                    skills: !!member.skills ? member.skills : DEFAULT_SKILLS,
                    scores: !!member.scores ? this.getModScores(member.scores) : this.getModScores(DEFAULT_CORE),
                    speed: !!member.speed ? member.speed : 25,
                }

                if (!!nonMod) {
                    object.scores = !!member.scores ? member.scores : DEFAULT_CORE
                }
            }
        }
        return object
    }

    getCore(scores, array, mod) {
        let core = {}
        if (!!scores && scores.length > 0) {
            array.forEach((name,index) => {
                const mod = this.$rsd.format.getAbilityScoreModifier(scores[index])
                core[name] = {mod: mod}
            })
        }
        return core
    }

    getModScores(scores) {
        let modScores = [0,0,0,0,0,0]
        if (!!scores && scores.length > 0) {
            scores.forEach((score,index) => {
                modScores[index] = this.$rsd.format.getAbilityScoreModifier(score)
            })
        }
        return modScores
    }

    getPerceptionMod(combatant) {
        let perception = null

        if (!!combatant && !!combatant.id && !!combatant.type) {
            const member = this.get(combatant.id, combatant.type)
            
            if (!!member) {
                const score_name = this.$rsd.format.saveScore('perception')
                const score = member.scores[this.$rsd.format.scoreIndexes[score_name]]
                perception = member.perception
                perception = !!member.adv ? this.$rsd.format.getSaveModifier(score, member.level, perception) : perception
            }
        }
        return perception
    }

    /* Setters */
    set target(newTarget) {
        if (!!isGM) {
            this.$store.dispatch('rsd/setPartyTarget', newTarget)
        } else {
            this.error(ERRCODES[14],`Error: newTarget [${newTarget}] is not valid or no a GM.`)
        }
    }

    /* Adders */
    addGMC(newGMC) {
        if (!!newGMC && !!newGMC.name && !!this.$rsd.campaigns.active) {
            const level = this.$rsd.campaigns.active.level
            const a = !!newGMC.ancestry ? newGMC.ancestry : null
            const b = !!newGMC.background ? newGMC.background : null
            const c = !!newGMC.class ? newGMC.class : null
            const gmcData = {
                ac: 10,
                level: level,
                abc: !!a || !!b || !!c ? {
                    a: !!a ? a : null,
                    b: !!b ? b : null,
                    c: !!c ? c : null,
                } : null,
                maxhp: 8,
                name: newGMC.name,
                perception: 0,
                saves: DEFAULT_SAVES,
                scores: DEFAULT_CORE,
                skills: DEFAULT_SKILLS,
                speed: 25,
            }

            CampaignService.addGMC(gmcData)
        }
    }

    addCondition(id, memberType, newData, callback = null, oldConditions = null) {
        if (!!this._validmid(id) && !!this._validCondition(newData)) {
            const data = this.get(id, memberType)

            if (!!data && !!data._key) {
                const key = data._key
                const conditions = !!oldConditions ? oldConditions : this.getConditions(key)

                // Check if the condition is already applied
                // If duration is longer -> override
                // If duration is shorter -> do nothing
                // If value is different -> apply as well
                let worseDuplicate = false
                let newConditions = []
                if (!!conditions && conditions.length > 0) {
                    conditions.forEach(c => {
                        if (!!c && !!c.type && c.type.toLowerCase() != newData.type.toLowerCase()) {
                            newConditions.push({...c})
                        } else if (!!c && !!c.type && c.type.toLowerCase() == newData.type.toLowerCase() && c.type.toLowerCase() != 'temporary hp') {
                            // Special exception if it's persistent damage condition
                            if (c.type.toLowerCase() == 'persistent damage') {
                                // If the damage type matches we need to take the bigger value. Otherwise, just add it
                                if (c.dmg == newData.dmg) {
                                    if (c.value >= newData.value) {
                                        newConditions.push({...c})
                                        worseDuplicate = true
                                    }
                                } else {
                                    newConditions.push(c)
                                }
                            } else if (c.type.toLowerCase() == 'custom') {
                                newConditions.push({...c})
                            } else {
                                // If the condition value is equal, take the one with longer condition. Otherwise, just add it.
                                if (c.value == newData.value) {
                                    if (c.duration >= newData.duration) {
                                        newConditions.push({...c})
                                        worseDuplicate = true
                                    }
                                } else {
                                    newConditions.push({...c})
                                }
                            }
                        }
                    })
                }

                // TODO: Check if drained -> it's special that way (does damage)

                // Only add the new condition if it's not worse than an existing one
                if (!worseDuplicate) {
                    let addedCondition = {type: newData.type, id: this.$rsd.random.getRandomUID(20)}
                    if (!!newData.name) { addedCondition.name = newData.name }
                    if (!!newData.value) { addedCondition.value = newData.value }
                    if (!!newData.reduce) { addedCondition.reduce = newData.reduce }
                    if (!!newData.floor) { addedCondition.floor = newData.floor }
                    if (!!newData.duration) { addedCondition.duration = newData.duration }
                    if (!!newData.dmg) { addedCondition.dmg = newData.dmg }

                    // TODO: Custom condition styling
                    // if (!!newData.icon) { addedCondition.icon = newData.icon }

                    newConditions.push({...addedCondition})

                    if (addedCondition.type.toLowerCase() != 'custom') {
                        this._addMissingLinked(newData.type, newConditions)
                    }

                    if (addedCondition.type.toLowerCase() == 'persistent damage') {
                        // Add to recent pdamage
                        this.$store.dispatch('rsd/pushRecentPDamage', addedCondition)
                    } else if (addedCondition.type.toLowerCase() != 'temporary hp') {
                        // Add to recent condition
                        this.$store.dispatch('rsd/pushRecentCondition', addedCondition)
                    }

                    if (!!newConditions && newConditions.length > 0) {
                        CombatService.updateCombatMembersConditionsById(key, newConditions, callback)
                    }
                }
            } else {
                this.error(ERRCODES[25],`Error: data [${data}] is not valid.`)
            }
        }
    }

    /* Updaters */
    updateGMC(id, newData) {
        if (!!this._validmid(id) && !!newData) {
            const data = this.getGMC(id)
            const updatedData = {...data, ...newData}
            
            if (!!isGM && !!data && !!updatedData && !!this._validGMC(updatedData)) {
                const key = data._key

                CampaignService.updateGMCByID(key, {...updatedData, _key: null}, (success) => {
                    if (!!success) {
                        setTimeout(() => {
                            this.updateTarget(key)
                        }, 100)
                    }
                })
            } else {
                this.error(ERRCODES[0],`Error: Not a GM.`)
            }
        } else {
            this.error(ERRCODES[18],`Error: key [${key}] or [${newData}] are not valid.`)
        }
    }

    doDamage(id, newData) {
        if (!!this._validmid(id) && !!newData && !!newData.memberType) {
            const data = this.get(id, newData.memberType)

            if (!!data && !!data._key) {
                const key = data._key
                const charData = this.getCharData(key)

                if (!!charData) {
                    // TODO: add health info for PC's once the builder is implemented
                    const totalDamage = this.$rsd.combat.getTotalDamage([newData])

                    let newTempHP = charData.temphp
                    let newHP = charData.hp

                    if (newTempHP - totalDamage > 0) {
                        newTempHP -= totalDamage
                    } else {
                        const risidualDamage = Math.abs((newTempHP - totalDamage))
                        newTempHP = 0
                        newHP -= risidualDamage
                        this._removeTemporaryHP(key)
                    }

                    const newCharData = {temphp: newTempHP, hp: Math.max(newHP, 0)}
                    CampaignService.updateCharSpecificData(key, newCharData, (success) => {
                        if(!!success) {
                            if (newHP <= 0) {
                                this.increaseMemberDying(key, newData.memberType, !!newData.crit ? 2 : 1)
                            }
                        }
                    })

                    // Add to recent damage
                    this.$store.dispatch('rsd/pushRecentDamage', {type: newData.dmg, value: newData.value})
                } else {
                    this.error(ERRCODES[19],`Error: charData [${charData}] is not valid.`)
                }
            }
        } else {
            this.error(ERRCODES[18],`Error: id [${id}] or [${newData}] are not valid.`)
        }
    }

    setHealth(id, newData) {
        if (!!this._validmid(id) && !!newData && !!newData.memberType) {
            const data = this.get(id, newData.memberType)

            if (!!data && !!data._key) {
                const key = data._key
                const charData = this.getCharData(key)

                if (!!charData) {
                    this._handleHealDying(key)

                    const newCharData = {temphp: newData.temphp, hp: newData.hp}

                    CampaignService.updateCharSpecificData(key, newCharData)
                } else {
                    this.error(ERRCODES[19],`Error: charData [${charData}] is not valid.`)
                }
            }
        } else {
            this.error(ERRCODES[18],`Error: id [${id}] or [${newData}] are not valid.`)
        }
    }

    doHeal(id, newData) {
        if (!!this._validmid(id) && !!newData && !!newData.memberType) {
            const data = this.get(id, newData.memberType)

            if (!!data && !!data._key) {
                const key = data._key
                const charData = this.getCharData(key)

                if (!!charData) {
                    this._handleHealDying(key)

                    const newCharData = {temphp: charData.temphp, hp: Math.min(charData.hp + newData.hp, data.maxhp)}

                    CampaignService.updateCharSpecificData(key, newCharData)
                } else {
                    this.error(ERRCODES[19],`Error: charData [${charData}] is not valid.`)
                }
            }
        } else {
            this.error(ERRCODES[18],`Error: id [${id}] or [${newData}] are not valid.`)
        }
    }

    doTemporaryHP(id, newData) {
        if (!!this._validmid(id) && !!newData && !!newData.memberType) {
            const data = this.get(id, newData.memberType)

            if (!!data && !!data._key) {
                const key = data._key
                const charData = this.getCharData(key)
                if (!!charData) {
                    const newCharData = {temphp: Math.max(newData.value, 0), hp: charData.hp}
                    CampaignService.updateCharSpecificData(key, newCharData, (success) => {
                        if (!!success) {
                            this.addCondition(key, newData.memberType, {type: 'temporary hp', duration: newData.duration})
                        }
                    })
                } else {
                    this.error(ERRCODES[19],`Error: charData [${charData}] is not valid.`)
                }
            } else {
                this.error(ERRCODES[18],`Error: data [${data}] is not valid.`)
            }
        }

    }

    // This will remove the dying condition (and linked)
    // This will also add wounded based on the dying value
    _handleHealDying(id, healed = true) {
        const conditions = this.getConditions(id)
        if (!!conditions && conditions.length > 0) {
            const dying = conditions.find(c => c.type.toLowerCase() == 'dying')
            const wounded = conditions.find(c => c.type.toLowerCase() == 'wounded')
            let woundedValue = 0
            let linked = []

            if (!!dying) {
                woundedValue += 1
                linked = !!healed ? this.$rsd.conditions.getConditionsLinkedRecursive('dying') : [{type: 'dying'}]
            }
            if (!!wounded) {
                woundedValue += wounded.value
            }

            let newConditions = []
            conditions.forEach(c => {
                if ((!c.linked && (!!dying && c.id != dying.id)) || (!linked || (!!linked && linked.length == 0)) || (!!linked && linked.length > 0 && !linked.find(l => l.type.toLowerCase() == c.type.toLowerCase()))) {
                    newConditions.push({...c})
                }
            })

            if (!!woundedValue && woundedValue > 0) {
                if (!!wounded) {
                    const woundedIndex = newConditions.findIndex(nc => nc.id == wounded.id)
                    if (woundedIndex != -1) {
                        newConditions[woundedIndex].value = woundedValue
                    }
                } else {
                    newConditions.push({type: 'wounded', value: woundedValue, id: this.$rsd.random.getRandomUID(20)})
                }
            }

            if (!!newConditions && newConditions.length > 0) {
                newConditions.forEach(c => {
                    this._addMissingLinked(c.type, newConditions)
                })
            }

            if (!!newConditions && newConditions.length > 0) {
                CombatService.updateCombatMembersConditionsById(id, newConditions)
            }
        }
    }

    _removeTemporaryHP(id) {
        const conditions = this.getConditions(id)
        if (!!conditions && conditions.length > 0) {
            const tempHP = conditions.find(c => c.type.toLowerCase() == 'temporary hp')

            let newConditions = []
            conditions.forEach(c => {
                if (!!tempHP && c.id != tempHP.id) {
                    newConditions.push({...c})
                }
            })

            if (!!newConditions && newConditions.length > 0) {
                newConditions.forEach(c => {
                    this._addMissingLinked(c.type, newConditions)
                })
            }

            if (!!newConditions && newConditions.length > 0) {
                CombatService.updateCombatMembersConditionsById(id, newConditions)
            }
        }
    }

    _addMissingLinked(newType, newConditions) {
        let newLinked = this.$rsd.conditions.getConditionsUnAndLinkedRecursive(newType.toLowerCase())

        // TODO: Distinguish between linked / unlinked and add 'linked' boolean to them?
        if (!!newLinked && newLinked.length > 0) {
            newLinked.forEach(l => {
                const alreadyApplied = newConditions.find(nc => nc.type.toLowerCase() == l.type.toLowerCase())
                if (!alreadyApplied) {
                    newConditions.push({...l, id: this.$rsd.random.getRandomUID(20)})
                }
            })
        }
    }

    increaseMemberDying(id, memberType, value, oldConditions = null) {
        if (!!value && value > 0 && !!this._validmid(id)) {
            const data = this.get(id, memberType)

            if (!!data && !!data._key) {
                const key = data._key
                const conditions = !!oldConditions ? oldConditions : this.getConditions(key)
                
                if (!!conditions && conditions.length > 0) {
                    const dying = conditions.find(c => c.type.toLowerCase() == 'dying')
                    const wounded = conditions.find(c => c.type.toLowerCase() == 'wounded')
                    let dyingValue = value

                    if (!!dying) {
                        dyingValue += dying.value

                        this.updateCondition(key, memberType, {id: dying.id, type: 'dying', value: dyingValue}, conditions)
                    } else {
                        if (!!wounded) {
                            dyingValue += wounded.value
                        }

                        this.addCondition(key, memberType, {type: 'dying', value: dyingValue}, null, conditions)
                    }
                } else {
                    this.addCondition(key, memberType, {type: 'dying', value: value})
                }
            }
        }
    }

    updateCondition(id, memberType, newData, newConditions = null) {
        if (!!this._validmid(id) && !!this._validCondition(newData)) {
            const data = this.get(id, memberType)
            if (!!data && !!data._key) {
                const key = data._key
                const conditions = !!newConditions ? newConditions : this.getConditions(key)

                let newConditionsList = []
                if (!!conditions && conditions.length > 0) {
                    conditions.forEach(c => {
                        if (!!c && !!c.id && c.id != newData.id) {
                            newConditionsList.push({...c})
                        } else if (!!c && !!c.id && c.id == newData.id) {
                            newConditionsList.push({...newData})
                        }
                    })
                }

                if (!!newConditionsList && newConditionsList.length > 0) {
                    CombatService.updateCombatMembersConditionsById(key, newConditionsList)
                }
            } else {
                this.error(ERRCODES[25],`Error: data [${data}] is not valid.`)
            }
        }
    }

    /* Deleters */
    removeMember(member, callback = null) {
        if (!!member && !!member.type) {
            if (member.type.toLowerCase() == 'gmc') {
                CampaignService.removeGMC(member.id, callback)
            } else if (member.type.toLowerCase() == 'pc' && !!member.uid && !!member.id && !!this.$rsd.campaigns.activeKey && !!this.$rsd.campaigns.uid) {
                auth.profile().then(profile => {
                    if (!!profile && !!profile.secret) {
                        CampaignService.kickPartyMember(member.uid, member.id, this.$rsd.campaigns.activeKey, profile.secret)
                        if (!!callback) {
                            callback()
                        }
                    } else {
                        console.log('No secret')
                    }
                })
            }
        }
    }

    removeCondition(id, memberType, newData, callback = null) {
        if (!!this._validmid(id) && !!this._validCondition(newData)) {
            const data = this.get(id, memberType)
            if (!!data && !!data._key) {
                const key = data._key
                const conditions = this.getConditions(key)

                if (!!conditions && conditions.length > 0) {
                    const candidateCondition = conditions.find(c => c.id == newData.id)
                    if (!!candidateCondition) {
                        const linked = this.$rsd.conditions.getConditionsLinkedRecursive(newData.type.toLowerCase())

                        let newConditions = []
                        conditions.forEach(c => {
                            if ((!c.linked && c.id != candidateCondition.id) || (!linked || (!!linked && linked.length == 0)) || (!!linked && linked.length > 0 && !linked.find(l => l.type.toLowerCase() == c.type.toLowerCase()))) {
                                newConditions.push({...c})
                            }
                        })

                        if (!!newConditions && newConditions.length > 0) {
                            newConditions.forEach(c => {
                                this._addMissingLinked(c.type, newConditions)
                            })
                        }

                        if (!!newConditions) {
                            CombatService.updateCombatMembersConditionsById(key, newConditions, callback)
                        }
                    }
                }
            } else {
                this.error(ERRCODES[25],`Error: data [${data}] is not valid.`)
            }
        }
    }

    /* Functions */
    updateTarget(id) {
        const key = this.all.findIndex(a => a.id == id)

        if (!!id && (!!key || key == 0)) {
            let oldTarget = {...this.all[key]}

            const basestats = this.$rsd.members.getStats(oldTarget)
            const object = this.$rsd.members.getObject(oldTarget)
            const stats = this.$rsd.conditions.getStatsObject(oldTarget, basestats, oldTarget.conditions, object)

            const memberObject = {
                ...oldTarget,
                basestats: basestats,
                name: oldTarget.name,
                identifier: this.$rsd.combat.getIdentifier(oldTarget, object),
                object: this.$rsd.members.getObject(oldTarget),
                stats: stats,
                _key: key,
            }

            this.target = memberObject
        }
    }
}