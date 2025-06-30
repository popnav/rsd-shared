import { CampaignService, CombatService, AncestryService, BackgroundService, ClassService, isGM} from '@/services'
import { DefaultController } from './DefaultController'

import auth from '@root/.shared/services/AuthService'

const ERRCODES = {
    0: 'L00', // Error: cid [${cid}] was not valid or empty.
    1: 'L01', // Error: id [${id}] was not valid or empty.
    2: 'L02', // Error: type of id [${id}] was not a number or string.
    3: 'L03', // Error: ID [${newID}] is not valid.
    4: 'L04', // Error: ID [${newID}] is not of type string or is empty.
    5: 'L05', // Error: Party [${newCharacter}] is not valid.
    6: 'L06', // Error: character.name [${character.name}] is not of type string.
    7: 'L07', // Error: party [${character}] is not valid or empty.
    8: 'L08', // Error: Data not found
    9: 'L09', // Error: key [${key}] or [${newStats}] are not valid.
    10: 'L10', // Error: Data not found
    11: 'L11', // Error: key [${key}] is not valid.
    12: 'L12', // Error: key [${key}] or [${newABC}] are not valid.
    13: 'L13', // Error: array [${array}] is not of type object or is empty.
    14: 'L14', // Error: newIds [${newIds}] is not valid or is empty.
    15: 'L15', // Error: key [${key}] or [${newData}] are not valid.
    16: 'L16', // Error: charData [${charData}] is not valid.
    17: 'L17', // Error: data [${data}] is not valid.
    18: 'L18', // Error: condition.type [${condition.type}] is not of type string.
    19: 'L19', // Error: condition.name [${condition.name}] is not of type string.
    20: 'L20', // Error: condition.duration [${condition.duration}] is not of type number.
    20: 'L21', // Error: condition.value [${condition.value}] is not of type number.
    20: 'L22', // Error: condition [${condition}] is not valid or empty.
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

export class PlayerCharacterController extends DefaultController {
    constructor(isDev) {
        super(isDev)
    }

    /* Internal functions */

    _validCharacter(character) {
        if (!!character && !!character.name) {
            if (typeof(character.name) != 'string') {
                this.error(ERRCODES[6],`Error: character.name [${character.name}] is not of type string.`)
                return false
            }
            return true
        } else {
            this.error(ERRCODES[7],`Error: party [${character}] is not valid or empty.`)
            return false
        }
    }

    _getcid(id) {
        if (typeof(id) == 'number') {
            const cid = !!this.ids && id < this.ids.length ? this.ids[id] : null
            if (!!cid) {
                const keys = Object.keys(cid)
                return !!keys && !!keys[0] ? keys[0] : null
            } else {
                this.error(ERRCODES[0],`Error: cid [${cid}] was not valid or empty.`)
                return null
            }
        } else if (typeof(id) == 'string') {
            if (!!id) {
                return id
            } else {
                this.error(ERRCODES[1],`Error: id [${id}] was not valid or empty.`)
                return null
            }
        } else {
            this.error(ERRCODES[2],`Error: type of id [${id}] was not a number or string.`)
            return null
        }
    }

    _validCondition(condition) {
        if (!!condition && !!condition.type) {
            if (typeof(condition.type) != 'string') {
                this.error(ERRCODES[18],`Error: condition.type [${condition.type}] is not of type string.`)
                return false
            }
            if (!!condition.name && typeof(condition.name) != 'string') {
                this.error(ERRCODES[19],`Error: condition.name [${condition.name}] is not of type string.`)
                return false
            }
            if (!!condition.duration && typeof(condition.duration) != 'number') {
                this.error(ERRCODES[20],`Error: condition.duration [${condition.duration}] is not of type number.`)
                return false
            }
            if (!!condition.value && typeof(condition.value) != 'number') {
                this.error(ERRCODES[21],`Error: condition.value [${condition.value}] is not of type number.`)
                return false
            }
            return true
        } else {
            this.error(ERRCODES[22],`Error: condition [${condition}] is not valid or empty.`)
            return false
        }
    }

    /* Getters */
    get uid() {
        return CampaignService.getUID()
    }

    get activeKey() { return this.$store.getters['remotedb/playerCharacterActiveKey'] }
    get active() {
        let stats = {
            ...this.$store.getters['remotedb/playerCharacterActive'],
        }

        if (!!stats.abc) {
            if (!!stats.abc.a) {
                const item = this.$rsd.build.getAncestry(stats.abc.a)
                stats.ancestryObj = !!item ? item : null
            }
            if (!!stats.abc.b) {
                const item = this.$rsd.build.getBackground(stats.abc.b)
                stats.backgroundObj = !!item ? item : null
            }
            if (!!stats.abc.c) {
                const item = this.$rsd.build.getClass(stats.abc.c)
                stats.classObj = !!item ? item : null
            }
        }

        return stats
    }
    get ids() { return this.$store.getters['remotedb/playerCharacterIds'] }
    get stats() { return this.$store.getters['remotedb/playerCharacterStats'] }
    get names() { 
        let names = []

        if (!!this.stats && Object.keys(this.stats).length > 0) {
            Object.keys(this.stats).forEach(s => {
                if (!!this.stats[s] && !!this.stats[s].name) {
                    names.push({text: this.stats[s].name, value: s})
                }
            })
        }
        
        return names
    }
    get party() { return this.$store.getters['remotedb/campaighData'] }
    get characterData() { return this.$store.getters['remotedb/characterData'] }
    get membersConditions() { return this.$store.getters['remotedb/combatMembersConditions'] }

    get(id) {
        const cid = this._getcid(id)
        return !!cid && !!this.stats && !!this.stats[cid] ? this.stats[cid] : null
    }
    getCharData(id) {
        return !!id && !!this.characterData && !!this.characterData[id] ? this.characterData[id] : null
    }
    getConditions(id) {
        return !!id && !!this.membersConditions && !!this.membersConditions[id] ? this.membersConditions[id] : null
    }

    /* Setters */
    set activeKey(newID) {
        if (!!newID && typeof(newID) == 'string') {
            if (!!this.ids && !!this.includesKey(this.ids, newID)) {
                CampaignService.updatePCActive(newID)
            } else {
                this.error(ERRCODES[3],`Error: ID [${newID}] is not valid.`)
            }
        } else {
            this.error(ERRCODES[4],`Error: ID [${newID}] is not of type string or is empty.`)
        }
    }

    set active(newData) {
        // if (!!newData && typeof(newData) == 'object') {
        //     if (!!this.active && !!this.activeKey) {
        //         if (!!newData.name && typeof(newData.name) != 'string') {
        //             this.error(ERRCODES[5],`Error: newData.name [${newData.name}] is not of type string.`)
        //             return
        //         }
        //         if (!!newData.color && typeof(newData.color) != 'object' && typeof(newData.color.a) == 'number'
        //             && typeof(newData.color.r) == 'number' && typeof(newData.color.g) == 'number' && typeof(newData.color.b) == 'number') {
        //             this.error(ERRCODES[6],`Error: newData.color [${newData.color}] is not correct.`)
        //             return
        //         }
        //         if (!!newData.icon && typeof(newData.icon) != 'string') {
        //             this.error(ERRCODES[7],`Error: newData.icon [${newData.icon}] is not of type string.`)
        //             return
        //         }

        //         CampaignService.updatePartyData(this.activeKey, {
        //             ...this.active,
        //             name: !!newData.name ? newData.name.substr(0,30) : this.active.name,
        //             color: !!newData.color ? newData.color : this.active.color,
        //             icon: !!newData.icon ? newData.icon : this.active.icon
        //         })
        //     }
        // } else {
        //     this.error(ERRCODES[15],`Error: newData [${newData}] is not of type object or is not valid.`)
        // }
    }

    setArray(array) {
        if (!!array && typeof(array) == 'object' && array.length > 0) {
            if (!!this.ids) {
                let newIds = new Array(array.length)
                array.forEach((character, index) => {
                    newIds[index] = { [character._key]: true }
                })

                if (!!newIds && newIds.length >= 1) {
                    if (JSON.stringify(newIds) != JSON.stringify(this.ids)) {
                        CampaignService.updateLocalPCIds(newIds)
                    }
                } else {
                    this.error(ERRCODES[14],`Error: newIds [${newIds}] is not valid or is empty.`)
                }
            }
        } else {
            this.error(ERRCODES[13],`Error: array [${array}] is not of type object or is empty.`)
        }
    }

    getStats(nonMod = false) {
        const stats = this.active
        let object = null

        if (!!stats && !!this.activeKey) {

            object = {
                ac: !!stats.ac ? stats.ac : 10,
                level: !!stats.level ? stats.level : 1,
                maxhp: !!stats.maxhp ? stats.maxhp : 1,
                perception: !!stats.perception ? stats.perception : 0,
                saves: !!stats.saves ? stats.saves : [0,0,0],
                skills: !!stats.skills ? stats.skills : DEFAULT_SKILLS,
                scores: !!stats.scores ? this.getModScores(stats.scores) : this.getModScores(DEFAULT_CORE),
                speed: !!stats.speed ? stats.speed : 25,
            }

            if (!!nonMod) {
                object.scores = !!member.scores ? member.scores : DEFAULT_CORE
            }
        }
        return object
    }

    getObject() {
        const stats = this.active
        let object = null
        if (!!stats && !!this.activeKey) {
            object = {
                adv: !!stats.adv,
                level: !!stats.level ? stats.level : 1,
                rarity: 'unique',
                size: !!stats.size ? stats.size : 'medium',
                traits: ['humanoid'], // TODO add ancestry
                languages: ['common'], // TODO add languages
                core: !!stats.scores ? this.getCore(stats.scores, CORE_NAMES) : this.getCore(DEFAULT_CORE, CORE_NAMES),
                speeds: !!stats.speed ? {movement: stats.speed, other:{}} : {movement: 25, other:{}} // TODO add other speeds
            }

            if (!!object.adv) { object.traits.push('advanced') } else { object.traits.push('basic') }
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

    getScoreArrayLevel(id, level, exception = null) {
        const key = this._getcid(id)
        let returnArray = [10,10,10,10,10,10]
        if (!!key && !!level) {
            const data = this.get(key)
            if (!!data) {
                const ancestryObj = this.$rsd.build.getAncestry(data.abc.a)
                const backgroundObj = this.$rsd.build.getBackground(data.abc.b)
                const classObj = this.$rsd.build.getClass(data.abc.c)
                const boostTemplate = this.$rsd.build.getBoostsObject(ancestryObj, backgroundObj, classObj)

                for(let i = 1; i <= level; i++) {
                    if (!!data.build && !!data.build[i]) {
                        if (i==1) {
                            returnArray = this.$rsd.build.getCalculatedScoresArray(returnArray, boostTemplate, data.build[i])
                        } else {
                            returnArray = this.$rsd.build.getCalculatedScoresArray(returnArray, null, data.build[i])
                        }
                    } else if (!!exception && !!exception[i]) {
                        if (i==1) {
                            returnArray = this.$rsd.build.getCalculatedScoresArray(returnArray, boostTemplate, exception[i])
                        } else {
                            returnArray = this.$rsd.build.getCalculatedScoresArray(returnArray, null, exception[i])
                        }
                    }
                }
            }
        }

        return returnArray
    }

    getSkillsArrayLevel(id, level, exception = null) {
        const key = this._getcid(id)
        let returnArray = []
        if (!!key && !!level) {
            const data = this.get(key)
            if (!!data) {
                const backgroundObj = this.$rsd.build.getBackground(data.abc.b)
                const classObj = this.$rsd.build.getClass(data.abc.c)
                const bSkills = !!backgroundObj && !!backgroundObj.system && !!backgroundObj.system && !!backgroundObj.system.trainedSkills && !!backgroundObj.system.trainedSkills.value ? backgroundObj.system.trainedSkills.value : []
                const cSkills = !!classObj && !!classObj.system && !!classObj.system && !!classObj.system.trainedSkills && !!classObj.system.trainedSkills.value ? classObj.system.trainedSkills.value : []

                returnArray = returnArray.concat(bSkills)
                returnArray = returnArray.concat(cSkills)

                for(let i = 1; i <= level; i++) {
                    if (!!data.build && !!data.build[i] && !!data.build[i].sk && data.build[i].sk.length > 0) {
                        returnArray = returnArray.concat(data.build[i].sk)
                    } else if (!!exception && !!exception[i]) {
                        returnArray = returnArray.concat(exception[i].sk)
                    }
                }
            }
        }

        return returnArray
    }

    getSkillCount(skill_array) {
        const counts = {};
        if (!!skill_array && skill_array.length > 0) {
            for (const num of skill_array) {
                counts[num] = counts[num] ? counts[num] + 1 : 1;
            }
        }
        return counts
    }

    getSkillsTotalArrayLevel(id, level, exception = null) {
        const key = this._getcid(id)
        const skillNames = this.$rsd.format.skillNames
        let returnArray = new Array(skillNames.length)
        if (!!key && !!level) {
            const scores = this.getScoreArrayLevel(id, level, exception)
            const skills = this.getSkillsArrayLevel(id, level, exception)
            const skill_count = this.getSkillCount(skills)

            for(let i = 0; i < skillNames.length; i++) {
                returnArray[i] = (scores[this.$rsd.format.getSkillScore(skillNames[i])]-10)/2

                if (!!skill_count && !!skill_count[skillNames[i].substr(0,3)]) {
                    returnArray[i] = returnArray[i] + level + skill_count[skillNames[i].substr(0,3)]*2
                }
            }
        }
        return returnArray
    }

    getSavesArrayLevel(id, level, scores_array) {
        const key = this._getcid(id)
        let newSaves = [0,0,0]
        if (!!key && !!level && !!scores_array) {
            const data = this.get(key)
            if (!!data) {
                const classObj = this.$rsd.build.getClass(data.abc.c)

                if (!!classObj && !!classObj.system && !!classObj.system.savingThrows) {
                    const dexMod = ((scores_array[this.$rsd.format.scoreIndexes['dex']]-10)/2)
                    const conMod = ((scores_array[this.$rsd.format.scoreIndexes['con']]-10)/2)
                    const wisMod = ((scores_array[this.$rsd.format.scoreIndexes['wis']]-10)/2)

                    newSaves[this.$rsd.format.saveIndexes['fortitude']] = level + classObj.system.savingThrows.fortitude * 2 + conMod
                    newSaves[this.$rsd.format.saveIndexes['reflex']] = level + classObj.system.savingThrows.reflex * 2 + dexMod
                    newSaves[this.$rsd.format.saveIndexes['will']] = level + classObj.system.savingThrows.will * 2 + wisMod
                }
            }
        }
        return newSaves
    }

    getMaximumHP(id, level, scores_array) {
        const key = this._getcid(id)
        let newMaxHP = 8
        if (!!key && !!level && !!scores_array) {
            const data = this.get(key)
            if (!!data) {
                const ancestryObj = this.$rsd.build.getAncestry(data.abc.a)
                const classObj = this.$rsd.build.getClass(data.abc.c)
                
                if (!!ancestryObj && !!ancestryObj.system && !!classObj && !!classObj.system) {
                    const conMod = ((scores_array[this.$rsd.format.scoreIndexes['con']]-10)/2)
                    newMaxHP = ancestryObj.system.hp
                
                    // TODO: Get feats related to class/general that increase HP
                    for(let i = 1; i <= level; i++) {
                        newMaxHP += classObj.system.hp + conMod
                    }
                }
            }
        }
        return newMaxHP
    }

    getTotalAC(id, level, scores_array) {
        const key = this._getcid(id)
        let newAC = 10
        if (!!key && !!level && !!scores_array) {
            const data = this.get(key)
            if (!!data) {
                const classObj = this.$rsd.build.getClass(data.abc.c)

                // TODO: deal with different armors once items are implemented
                if (!!classObj && !!classObj.system && !!classObj.system.defenses) {

                    const dexMod = ((scores_array[this.$rsd.format.scoreIndexes['dex']]-10)/2)
                    newAC = 10 + level + classObj.system.defenses.unarmored * 2 + dexMod
                }
            }
        }
        return newAC
    }

    getTotalPerception(id, level, scores_array) {
        const key = this._getcid(id)
        let newPerception = 10
        if (!!key && !!level && !!scores_array) {
            const data = this.get(key)
            if (!!data) {
                const classObj = this.$rsd.build.getClass(data.abc.c)

                if (!!classObj && !!classObj.system && !!classObj.system.perception) {

                    const wisMod = ((scores_array[this.$rsd.format.scoreIndexes['wis']]-10)/2)
                    newPerception = level + classObj.system.perception * 2 + wisMod
                }
            }

        }
        return newPerception
    }

    /* Adders */
    addPC(newCharacter) {
        if (!!newCharacter && !!this._validCharacter(newCharacter)) {
            CampaignService.addPC(newCharacter)
        } else {
            this.error(ERRCODES[5],`Error: Party [${newCharacter}] is not valid.`)
        }
    }

    addCondition(id, newData, callback = null, oldConditions = null) {
        const key = this._getcid(id)
        if (!!key && !!this._validCondition(newData)) {
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

    /* Modifiers */

    joinParty(data) {
        if (!!data && !!data.gmid && !!data.partyid && !!data.pcid) {
            auth.profile().then(profile => {
                if (!!profile && !!profile.secret) {
                    CampaignService.joinParty(profile.secret, data.gmid, data.partyid, data.pcid)
                }
            })
        } 
    }

    leaveParty(data) {
        if (!!data && !!data.gmid && !!data.partyid && !!data.pcid) {
            auth.profile().then(profile => {
                if (!!profile && !!profile.secret) {
                    // console.log(profile.secret, data)
                    CampaignService.leaveParty(profile.secret, data.gmid, data.partyid, data.pcid)
                }
            })
        }
    }

    updateBuild(id, level, newBuild) {
        const key = this._getcid(id)

        if (!!key && !!level && !!newBuild) {
            const data = this.get(key)
            if (!!data) {
                let exception = {}
                exception[level] = {...newBuild}

                // TODO: update this as soon as items are implemented
                const newScores = this.$rsd.playercharacters.getScoreArrayLevel(id, data.level, exception)
                const newSkills = this.$rsd.playercharacters.getSkillsTotalArrayLevel(id, data.level, exception)

                const newAC = this.$rsd.playercharacters.getTotalAC(id, data.level, newScores)
                const newMaxHP = this.$rsd.playercharacters.getMaximumHP(id, data.level, newScores)
                const newPerception = this.$rsd.playercharacters.getTotalPerception(id, data.level, newScores)
                const newSaves = this.$rsd.playercharacters.getSavesArrayLevel(id, data.level, newScores)

                // console.log(key, level, newBuild, newPerception)
                let newData = {
                    ...data, 
                    ac: newAC,
                    maxhp: newMaxHP,
                    perception: newPerception,
                    saves: newSaves,
                    scores: newScores, 
                    skills: newSkills,
                }
                if (!newData.build) {
                    newData.build = {}
                }
                newData.build[level] = {...newData.build[level], ...newBuild}

                CampaignService.updateLocalPCStats(key, {...newData})
            } else {
                this.error(ERRCODES[8],`Error: Data not found`)
            }
        } else {
            this.error(ERRCODES[9],`Error: key [${key}] or [${newBuild}] are not valid.`)
        }
    }

    updateChoice(id, level, choiceID, newChoice) {
        const key = this._getcid(id)

        if (!!key && !!level && !!choiceID && !!newChoice) {
            const data = this.get(key)
            if (!!data) {
                let newData = {
                    ...data,
                }
                // console.log('newData.build', {...newData.build[level]})
                if (!newData.build) {
                    newData.build = {}
                }
                let chc = {}
                if (!!newData.build[level] && !!newData.build[level].chc) {
                    chc = {...newData.build[level].chc, [choiceID]: newChoice}
                } else {
                    chc = {[choiceID]: newChoice}
                }

                this.updateBuild(id, level, {chc: chc})
            } else {
                this.error(ERRCODES[8],`Error: Data not found`)
            }
        } else {
            this.error(ERRCODES[9],`Error: key [${key}] or [${newChoice}] are not valid.`)
        }
    }
    
    updateDetails(id, newDetails) {
        const key = this._getcid(id)

        if (!!key && !!newDetails) {
            const data = this.get(key)
            if (!!data) {
                let newData = {
                    ...data,
                }
                // console.log('newData.build', {...newData.build[level]})
                if (!newData.dtl) {
                    newData.dtl = {...newDetails}
                } else {
                    newData.dtl = {...data.dtl, ...newDetails}
                }

                CampaignService.updateLocalPCStats(key, newData)
            } else {
                this.error(ERRCODES[8],`Error: Data not found`)
            }
        } else {
            this.error(ERRCODES[9],`Error: key [${key}] or [${newDetails}] are not valid.`)
        }
    }

    updateStats(id, newStats) {
        const key = this._getcid(id)

        if (!!key && !!newStats) {
            const data = this.get(key)
            if (!!data) {
                CampaignService.updateLocalPCStats(key, {...data, ...newStats})
            } else {
                this.error(ERRCODES[8],`Error: Data not found`)
            }
        } else {
            this.error(ERRCODES[9],`Error: key [${key}] or [${newStats}] are not valid.`)
        }
    }

    updateABC(id, newABC) {
        const key = this._getcid(id)
        // console.log(id, newABC)
        if (!!key && !!newABC) {
            const data = this.get(key)
            if (!!data) {
                const oldA = !!data.abc && !!data.abc.a ? ''+data.abc.a+'' : ''
                const oldB = !!data.abc && !!data.abc.b ? ''+data.abc.b+'' : ''
                const oldC = !!data.abc && !!data.abc.c ? ''+data.abc.c+'' : ''
                const abcObj = !!data.abc ? {abc: {...data.abc, ...newABC}} : {abc: {...newABC}}
                // console.log('{...data, ...abcObj}', {...data, ...abcObj})

                // TODO: clean up all build choices related to A / B / C that don't match the new choice
                let buildClean = false
                let cleanObj = {}
                if (!!oldA && oldA != abcObj.abc.a) {
                    buildClean = true
                    
                    data.build.forEach((value, index) => {
                        if (!!value && !!value.chc) {
                            Object.keys(value.chc).forEach(chcKey => {
                                if (!!value.chc[chcKey] && (value.chc[chcKey].cat == 'ancestryfeature' || value.chc[chcKey].cat == 'ancestry')) {
                                    if (!cleanObj[index]) {cleanObj[index] = []}
                                    cleanObj[index].push(chcKey)
                                }
                            })
                        }
                    })
                }
                if (!!oldB && oldB != abcObj.abc.b) {
                    buildClean = true

                }
                if (!!oldC && oldC != abcObj.abc.c) {
                    buildClean = true

                    data.build.forEach((value, index) => {
                        if (!!value && !!value.chc) {
                            Object.keys(value.chc).forEach(chcKey => {
                                if (!!value.chc[chcKey] && (value.chc[chcKey].cat == 'classfeature' || value.chc[chcKey].cat == 'class')) {
                                    if (!cleanObj[index]) {cleanObj[index] = []}
                                    cleanObj[index].push(chcKey)
                                }
                            })
                        }
                    })
                }

                if (!!buildClean) {
                    Object.keys(cleanObj).forEach(buildLevel => {
                        if (!!buildLevel) {
                            cleanObj[buildLevel].forEach(buildID => {
                                if (!!data.build[buildLevel] && data.build[buildLevel].chc[buildID]) {
                                    delete data.build[buildLevel].chc[buildID]
                                }
                            })
                        }
                    })
                }

                CampaignService.updateLocalPCStats(key, {...data, ...abcObj})
            } else {
                this.error(ERRCODES[8],`Error: Data not found`)
            }
        } else {
            this.error(ERRCODES[12],`Error: key [${key}] or [${newABC}] are not valid.`)
        }
    }

    doDamage(id, newData) {
        const key = this._getcid(id)
        if (!!key && !!newData) {
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
                            this.increaseMemberDying(key, !!newData.crit ? 2 : 1)
                        }
                    }
                })

                // Add to recent damage
                this.$store.dispatch('rsd/pushRecentDamage', {type: newData.dmg, value: newData.value})
            } else {
                this.error(ERRCODES[16],`Error: charData [${charData}] is not valid.`)
            }
        } else {
            this.error(ERRCODES[15],`Error: key [${key}] or [${newData}] are not valid.`)
        }
    }

    setHealth(id, newData) {
        const key = this._getcid(id)
        if (!!key && !!newData) {
            const charData = this.getCharData(key)
            const data = this.get(key)

            if (!!charData && !!data) {
                this._handleHealDying(key)

                const newCharData = {temphp: newData.temphp, hp: newData.hp}
                CampaignService.updateCharSpecificData(key, newCharData)
            } else {
                this.error(ERRCODES[16],`Error: charData [${charData}] is not valid.`)
            }
        } else {
            this.error(ERRCODES[15],`Error: key [${key}] or [${newData}] are not valid.`)
        }
    }

    doHeal(id, newData) {
        const key = this._getcid(id)
        if (!!key && !!newData) {
            const charData = this.getCharData(key)
            const data = this.get(key)

            if (!!charData && !!data) {
                this._handleHealDying(key)

                const newCharData = {temphp: charData.temphp, hp: Math.min(charData.hp + newData.hp, data.maxhp)}
                CampaignService.updateCharSpecificData(key, newCharData)
            } else {
                this.error(ERRCODES[16],`Error: charData [${charData}] is not valid.`)
            }
        } else {
            this.error(ERRCODES[15],`Error: key [${key}] or [${newData}] are not valid.`)
        }
    }

    doTemporaryHP(id, newData) {
        const key = this._getcid(id)
        if (!!key && !!newData) {
            const charData = this.getCharData(key)
            if (!!charData) {
                const newCharData = {temphp: Math.max(newData.value, 0), hp: charData.hp}
                CampaignService.updateCharSpecificData(key, newCharData, (success) => {
                    if (!!success) {
                        this.addCondition(key, {type: 'temporary hp', duration: newData.duration})
                    }
                })
            } else {
                this.error(ERRCODES[16],`Error: charData [${charData}] is not valid.`)
            }
        } else {
            this.error(ERRCODES[17],`Error: data [${data}] is not valid.`)
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

    increaseMemberDying(id, value, oldConditions = null) {
        const key = this._getcid(id)
        if (!!value && value > 0 && !!key) {
            const conditions = !!oldConditions ? oldConditions : this.getConditions(key)
            
            if (!!conditions && conditions.length > 0) {
                const dying = conditions.find(c => c.type.toLowerCase() == 'dying')
                const wounded = conditions.find(c => c.type.toLowerCase() == 'wounded')
                let dyingValue = value

                if (!!dying) {
                    dyingValue += dying.value

                    this.updateCondition(key, {id: dying.id, type: 'dying', value: dyingValue}, conditions)
                } else {
                    if (!!wounded) {
                        dyingValue += wounded.value
                    }

                    this.addCondition(key, {type: 'dying', value: dyingValue}, null, conditions)
                }
            } else {
                this.addCondition(key, {type: 'dying', value: value})
            }
        }
    }
    
    updateCondition(id, newData, newConditions = null) {
        const key = this._getcid(id)
        if (!!key && !!this._validCondition(newData)) {
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

    /* Deleters */
    removePC(id = this.activeKey, callback = null) {
        const key = this._getcid(id)
        if (!!key) {
            // CampaignService.leaveParty()
            const data = this.get(key)
            if (!!data) {
                if (!!data.partyid && !!data.gmid) {
                    auth.profile().then(profile => {
                        if (!!profile && !!profile.secret) {
                            CampaignService.leaveParty(profile.secret, data.gmid, data.partyid, key, (success) => {
                                if (!!success) {
                                    CampaignService.removePC(key, callback)
                                }
                            })
                            
                        } else {
                            console.log('No secret')
                        }
                    })
                } else {
                    CampaignService.removePC(key, callback)
                }
            } else {
                this.error(ERRCODES[10],`Error: Data not found`)
            }

            // EncounterBuilderService.removeEncountersForParty(cid)
            // CampaignService.removeParty(cid, callback)
        } else {
            this.error(ERRCODES[11],`Error: key [${key}] is not valid.`)
        }
    }

    removeCondition(id, newData, callback = null) {
        const key = this._getcid(id)
        if (!!key && !!this._validCondition(newData)) {
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