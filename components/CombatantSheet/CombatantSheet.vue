<template>
    <div 
        class="d-flex flex-column combatant-sheet alt-scrollbar pa-2"
        v-if="!!visible && !!combatant"
        :class="containerClass + (!!rsd.darkmode ? ' theme--dark' : '')"
    >
        <!-- Title -->
        <div class="d-flex flex-row align-center text-uppercase">
            <div class="d-flex flex-column">
                <template v-if="showFullName">
                    <span 
                        class="text-h6 roboto-condensed mb-n1"
                    >{{combatant.name}}</span>
                    <span 
                        class="text-subtitle-2 font-weight-regular icon_color--text mt-n1"
                        v-show="!!combatant.identifier"
                    >{{combatant.identifier}}</span>
                </template>
                <template v-else-if="showUniqueIdentifier">
                    <span 
                        class="text-h6 roboto-condensed mb-n1"
                    >{{uniqueOrAnonimizedName}}</span>
                    <span 
                        class="text-subtitle-2 font-weight-regular icon_color--text mt-n1"
                        v-show="!!combatant.identifier"
                    >{{combatant.identifier}}</span>
                </template>
                <template v-else-if="showUniqueNone">
                    <span 
                        class="text-h6 roboto-condensed mb-n1"
                    >{{uniqueOrAnonimizedName}}</span>
                    <span 
                        class="text-subtitle-2 font-weight-regular icon_color--text mt-n1"
                    >Unknown</span>
                </template>
                <template v-else>
                    <span 
                        class="text-h6 roboto-condensed mb-n1"
                    >{{anonimizedName}}</span>
                    <span 
                        class="text-subtitle-2 font-weight-regular icon_color--text mt-n1"
                    >Unknown</span>
                </template>
            </div>
            <v-spacer></v-spacer>
            <div class="text-h6">
                <span class="mr-1">{{combatant.type == 'hazard' ? 'hazard' : (combatant.type == 'npc' ? 'creature' : 'player')}}</span>
                <span v-show="!restricted">{{!!combatant.object && !!combatant.object.level ? combatant.object.level : 0}}</span>
                <span v-show="!!restricted">?</span>
            </div>
        </div>

        <hr />

        <div v-show="!isInitiated" class="mt-2 align-center">
            <!-- <v-progress-circular
                indeterminate
                :size="50"
                color="primary"
            ></v-progress-circular> -->
            <div class="d-flex">
                <v-skeleton-loader
                    class="mb-3 mr-1"
                    max-width="31"
                    max-height="20"
                    tile
                    type="chip"
                ></v-skeleton-loader>
                <v-skeleton-loader
                    class="mb-3"
                    max-width="61"
                    max-height="20"
                    tile
                    type="chip"
                ></v-skeleton-loader>
            </div>
            <v-skeleton-loader
                class="my-2"
                max-width="80"
                type="text"
            ></v-skeleton-loader>
            <v-skeleton-loader
                class="my-2"
                max-width="120"
                type="text"
            ></v-skeleton-loader>
            <v-skeleton-loader
                class="my-2"
                max-width="40"
                type="text"
            ></v-skeleton-loader>
            <v-skeleton-loader
                class="my-2"
                max-width="330"
                type="text"
            ></v-skeleton-loader>
            <hr />
            <v-skeleton-loader
                class="my-2"
                max-width="200"
                type="text"
            ></v-skeleton-loader>
            <v-skeleton-loader
                class="my-2"
                max-width="40"
                type="text"
            ></v-skeleton-loader>
            <v-progress-linear
                class="my-2"
                color="grey"
                indeterminate
                height="16"
            >
            </v-progress-linear>
            <hr />
            <v-skeleton-loader
                class="my-3"
                max-width="100"
                type="text"
            ></v-skeleton-loader>
        </div>
        <v-fade-transition>
            <div v-show="!!isInitiated">
                <!-- Traits -->
                <div v-if="!!combatant.object && !restricted" class="flex-row flex-wrap my-1" :class="(!!compact || !combatant.object || !!restricted) ? 'd-none' : 'd-flex'">
                    <BaseTraitChip 
                        v-if="!!combatant.object.rarity" 
                        :trait="combatant.object.rarity" 
                        :custom_class="$rsd.format.rarityColor(combatant.object.rarity)" 
                    />
                    <BaseTraitChip
                        v-if="combatant.type != 'hazard'"
                        v-for="trait in alignmentLikeTraits(combatant.object.traits)"
                        :key="'trait-'+trait"
                        :trait="trait"
                        :custom_class="$rsd.format.traitColor(trait)"
                    />
                    <BaseTraitChip :trait="combatant.object.size" :custom_class="'green darken-1'" />
                    <BaseTraitChip 
                        v-for="trait in otherTraits(combatant.object.traits)"
                        :key="'trait-'+trait" 
                        :trait="trait"
                        :custom_class="$rsd.format.traitColor(trait)"
                    />
                </div>
                <!-- TODO: Add for PC's when able -->
                <div v-else-if="!combatant.object && !restricted" class="my-1" :class="!!compact ? 'd-none' : 'd-flex'">
                    <BaseTraitChip :trait="'Neutral'" :custom_class="$rsd.format.traitColor('Neutral')" />
                    <BaseTraitChip :trait="'Medium'" :custom_class="'green darken-1'" />
                    <BaseTraitChip :trait="'human'" :custom_class="$rsd.format.traitColor('human')" />
                    <BaseTraitChip :trait="'humanoid'" :custom_class="$rsd.format.traitColor('humanoid')" />
                </div>

                <!-- Header text -->
                <div class="d-flex flex-column" v-if="!!combatant.object && !restricted">
                    <span v-if="!!combatant.object.source" v-show="!compact">
                        <span class="font-weight-bold mr-1">Source</span>
                        <span>{{combatant.object.source}}</span>
                    </span>
                    <StatsPerception v-if="!!combatant.stats && !!combatant.stats.perception && combatant.stats.perception.mod != null" :perception="combatant.stats.perception" :senses="combatant.object.senses" :cidentifier="combatant.identifier" />
                    <StatsStealth v-else-if="!!combatant.stats && !!combatant.stats.stealth && combatant.stats.stealth.value != null" :stealth="combatant.stats.stealth" :cidentifier="combatant.identifier" :dc="combatant.type == 'hazard'" />
                    <StatsLanguages :languages="combatant.object.languages" v-show="!compact" />
                    <StatsSkills v-if="combatant.type != 'hazard'" :skills="combatant.stats" :cidentifier="combatant.identifier" />
                    <StatsCore :core="combatant.object.core" :cidentifier="combatant.identifier" v-show="!compact" />
                    <!-- TODO: Add items here? -->
                    <CombatNote :combatant="combatant" v-if="!!isGM" />
                </div>

                <hr v-if="!!combatant.object && !restricted" />

                <!-- Health info & defensive abilities -->
                <div class="d-flex flex-column" v-if="!!combatant.object && !restricted">
                    <StatsSaves :stats="combatant.stats" :cidentifier="combatant.identifier" />
                    <StatsHealthInfo v-if="!!combatant.stats" :hpmax="combatant.stats.maxhp" :hpinfo="combatant.object.hpinfo" />
                    <!-- TODO: Healthbar -->
                    
                    <v-progress-linear
                        v-if="!!isGM && combatant.type != 'hazard' || ((!!localCharacter && !!localCharacter.id && localCharacter.id == combatant.id) || (!!activeSettings && !!activeSettings.pchp && activeSettings.pchp != $rsd.settings.getIndex('pchp', 'none')) && !!combatant.health && !!combatant.health.hp >= 0 && !!combatant.health.maxhp >= 0)"
                        :color="healthColor"
                        height="16"
                        class="text-subtitle-2 mb-1 pointer"
                        @click="openHealthDialog(index)"
                        :value="(!!isGM || (!!localCharacter && !!localCharacter.id && localCharacter.id == combatant.id) || activeSettings.pchp == $rsd.settings.getIndex('pchp', 'full')) && !!combatant.health && !!combatant.health.hp >= 0? 
                        100*((combatant.health.hp + (combatant.health.temphp || 0))/combatant.health.maxhp) : 100"
                        @contextmenu="openDamageDialog($event, index)"
                    >
                        <div v-show="!!isGM || (!!localCharacter && !!localCharacter.id && localCharacter.id == combatant.id) || activeSettings.pchp == $rsd.settings.getIndex('pchp', 'full')">
                            <span class="mr-1" v-if="!!combatant.health && !!combatant.health.hp >= 0">{{combatant.health.hp}}</span> 
                            <span v-if="!!combatant.health && combatant.health.temphp > 0" class="mr-1">(+{{combatant.health.temphp}})</span>
                            <span v-if="!!combatant.health && combatant.health.maxhp > 0">/ {{combatant.health.maxhp}}</span>
                        </div>
                    </v-progress-linear>
                    <div v-if="!!combatant.object.actions">
                        <StatsActions :actions="combatant.object.actions.defensive" />
                    </div>
                </div>
                <div class="d-flex flex-column" v-if="!!combatant.object">
                    <div class="d-flex flex-row flex-wrap my-1">
                        <v-card  
                            v-for="(cvalue, cindex) in combatant.conditions" 
                            :key="'condition-'+cindex" 
                            outlined
                            tile
                            @click="openEditConditionDialog(index, cvalue)"
                        >
                            <ConditionCard :condition="cvalue" :label="true" />
                        </v-card>
                    </div>
                </div>

                <hr v-if="!!combatant.object && !restricted" />

                <!-- Hazard details -->
                <div class="d-flex flex-column" v-if="!!combatant.object && combatant.type == 'hazard' && !restricted">
                    <HazardDisable :detail="combatant.object.disable" :modifier="-profnolevel" />
                    <span v-if="!!combatant.object.complex">This is a complex trap</span>
                    <HazardReset :detail="combatant.object.reset" />
                    <HazardRoutine :detail="combatant.object.routine" />
                </div>

                <!-- Offsensive abilities -->
                <div class="d-flex flex-column" v-if="!!combatant.object && !restricted">
                    <StatsSpeeds :speeds="combatant.object.speeds" v-show="!compact" />
                    <StatsSpellcasting v-if="!!combatant.object.spellcasting" :casting="combatant.object.spellcasting" :cuid="combatant.id" :slots="true" :focuspoints="combatant.object.focuspoints" />
                    <StatsAttacks v-if="!!combatant.object.actions" :attacks="combatant.object.actions.attacks" :cidentifier="combatant.identifier" />
                    <StatsActions v-if="!!combatant.object.actions" :actions="combatant.object.actions.offensive" v-show="!compact" :modifier="modifier" />
                </div>

            </div>
        </v-fade-transition>
        <!-- <span>{{combatant.object}}</span> -->
    </div>
</template>

<script>
import { isGM  } from '@/services'

import BaseTraitChip from '@root/.shared/components/base/BaseTraitChip'

import CombatNote from './components/CombatNote'

import HazardDisable from './components/HazardDisable'
import HazardReset from './components/HazardReset'
import HazardRoutine from './components/HazardRoutine'

import StatsPerception from './components/StatsPerception'
import StatsStealth from './components/StatsStealth'
import StatsLanguages from './components/StatsLanguages'
import StatsSkills from './components/StatsSkills'
import StatsCore from './components/StatsCore'
import StatsSaves from './components/StatsSaves'
import StatsHealthInfo from './components/StatsHealthInfo'
import StatsActions from './components/StatsActions'
import StatsSpeeds from './components/StatsSpeeds'
import StatsAttacks from './components/StatsAttacks'
import StatsSpellcasting from './components/StatsSpellcasting'

import ConditionCard from './components/ConditionCard'

import AlignmentMixin from '@root/.shared/mixin/AlignmentMixin'

export default {
    mixins: [
        AlignmentMixin,
    ],
    components: {
        BaseTraitChip,
        CombatNote,
        ConditionCard,
        HazardDisable,
        HazardReset,
        HazardRoutine,
        StatsPerception,
        StatsLanguages,
        StatsSkills,
        StatsCore,
        StatsSaves,
        StatsHealthInfo,
        StatsActions,
        StatsSpeeds,
        StatsAttacks,
        StatsSpellcasting,
        StatsStealth,
    },
    props: {
        visible: Boolean,
        containerClass: String,
        compact: Boolean,
        index: [Number, String],
        restricted: Boolean,
        localCharacter: Object,
        nonCombat: Boolean,
        instanceArray: String,
        instance: Object,
    },
    data() {
        return {
            refreshKey: 0,
            combatantTimer: null,
            maxCombatantTimer: 10,
            initiated: false
        }
    },
    computed: {
        isInitiated() {
            return !!this.initiated && !this.refresh
        },
        combatant() {
            if (!!this.index || this.index == 0) {
                if (!!this.instanceArray && !!this[this.instanceArray] && !!this[this.instanceArray][this.index]) {
                    return this[this.instanceArray][this.index]
                } else if (!!this.instance) {
                    return this.instance
                }
            }
        },
        healthColor() {
            if (!!this.combatant && !!this.combatant.health) {
                const percentConstant = 100 / Math.max(this.combatant.health.maxhp, this.combatant.health.hp)
                const hpPercent = this.combatant.health.hp * percentConstant / 100
                return this.$rsd.format.getColorBlend('#c70000', '#15c700', hpPercent)
            }
        },
        profnolevel() {
            return !!this.$rsd.settings.getActiveSettings() && !!this.$rsd.settings.getActiveSettings().profnolevel && !!this.combatant && !!this.combatant.object ? this.combatant.object.level : 0
        },
        adjusted() {
            return !!this.tindex && !!this.tindex.adj && this.tindex.adj != 'normal'
        },
        modifier() {
            return !!this.adjusted ? (this.tindex.adj == 'weak' ? -2 : 2) : 0 
        },
        showFullName() {
            return !!this.isGM || !!this.combatant && !!this.activeSettings && ((this.combatant.type == 'pc' || this.combatant.type == 'gmc') || (!!this.activeSettings.npcname && this.activeSettings.npcname == this.$rsd.settings.getIndex('npcname', 'full')))
        },
        showUniqueIdentifier() {
            return !!this.combatant && !!this.activeSettings && (!!this.activeSettings.npcname && this.activeSettings.npcname == this.$rsd.settings.getIndex('npcname', 'identifier and unique id'))
        },
        showUniqueNone() {
            return !!this.combatant && !!this.activeSettings && (!!this.activeSettings.npcname && this.activeSettings.npcname == this.$rsd.settings.getIndex('npcname', 'unique id'))
        },
        uniqueOrAnonimizedName() {
            return !!this.combatant && ((!!this.combatant.object && !this.combatant.object.name) || (!!this.combatant.object && !!this.combatant.object.name && this.combatant.name != this.combatant.object.name)) ? this.combatant.name : this.anonimizedName
        },
        anonimizedName() {
            return !!this.combatant ? `Combatant - ${this.combatant.id.substr(0,3)}` : 'Combatant'
        },
        isGM() {
            return isGM
        }
    },
    methods: {
        openEditConditionDialog(mkey, condition) {
            if (!!isGM || (!!this.localCharacter && !!this.localCharacter.id && this.localCharacter.id == this.combatant.id)) {
                if (!!condition.type && (!!mkey || mkey == 0)) {
                    const duration = this.$rsd.conditions.hasDuration(condition.type)
                    const value = this.$rsd.conditions.hasValue(condition.type)
                    const pdmg = this.$rsd.conditions.isPersistentDamage(condition.type)
                    

                    if (!!pdmg) {
                        this.$rsd.dialog.open({name: 'addPersistentDamageDialog', attrs: [true, {...condition, _key: mkey, memberType: this.combatant.type, local: !!this.nonCombat ? this.nonCombat : false}, {}]})
                    } else if (!!duration && !!value) {
                        this.$rsd.dialog.open({name: 'addConditionBothDialog', attrs: [true, {...condition, _key: mkey, memberType: this.combatant.type, local: !!this.nonCombat ? this.nonCombat : false}]})
                    } else if (!!duration) {
                        this.$rsd.dialog.open({name: 'addConditionDurationDialog', attrs: [true, {...condition, _key: mkey, memberType: this.combatant.type, local: !!this.nonCombat ? this.nonCombat : false}]})
                    } else if (!!value) {
                        this.$rsd.dialog.open({name: 'addConditionValueDialog', attrs: [true, {...condition, _key: mkey, memberType: this.combatant.type, local: !!this.nonCombat ? this.nonCombat : false}]})
                    } else {
                        this.$rsd.dialog.open({name: 'addConditionDialog', attrs: [true, {...condition, _key: mkey, memberType: this.combatant.type, local: !!this.nonCombat ? this.nonCombat : false}]})
                    }
                }
            }
        },
        openHealthDialog(mkey) {
            if (!!isGM || (!!this.localCharacter && !!this.localCharacter.id && this.localCharacter.id == this.combatant.id)) {
                if (!!mkey || mkey == 0) {
                    this.$rsd.dialog.open({name: 'combatantHealthDialog', attrs: [true, {...this.combatant.health, name: this.combatant.name, id: this.combatant.id, local: (!isGM && !this.isCombatOverview)}, {maxhp: this.combatant.health.maxhp}]})
                }
            }
        },
        openDamageDialog(event, mkey) {
            event.preventDefault()
            if (!!isGM || (!!this.localCharacter && !!this.localCharacter.id && this.localCharacter.id == this.combatant.id)) {
                if (!!mkey || mkey == 0) {
                    this.$rsd.dialog.open({name: 'damageDialog', attrs: [true, 
                        {value:1, affected: [this.combatant], dmg: 'untyped'}]
                    })
                }
            }
        }
    },
    mounted() {
        this.combatantTimer = setInterval(() => {
            this.refreshKey++

            let nullCheck = true
            if (!this.combatant || !this.combatant.basestats) {
                nullCheck = false
            }

            if (this.refreshKey == this.maxCombatantTimer || !!nullCheck) {
                clearInterval(this.combatantTimer)
                this.initiated = true
            }
        }, 500)

        // console.log('combatat', this.combatant)

        // setTimeout(() => {
        //     this.$forceUpdate()
        // }, 1000)
    }
}
</script>

<style lang="less" scoped>
.combatant-sheet {
    overflow-y: scroll;
    overflow-x: clip;
}
.mobile-view {
    width: calc(~"100vw");
    max-width: calc(~"100vw");
    height: calc(~"100vh - 160px");
    max-height: calc(~"100vh - 160px");
}
.full-column-view {
    width: calc(~"100vw - 48px");
    max-width: calc(~"100vw - 48px");
    height: calc(~"50vh - 40px");
    max-height: calc(~"50vh - 40px");
}
.full-row-view {
    width: calc(~"50vw - 24px");
    max-width: calc(~"50vw - 24px");
    height: calc(~"100vh - 80px");
    max-height: calc(~"100vh - 80px");
}
.full-overlap-view {
    width: calc(~"100vw - 48px");
    max-width: calc(~"100vw - 48px");
    height: calc(~"100vh - 80px");
    max-height: calc(~"100vh - 80px");
}
.full-tactical-current-view {
    width: calc(~"100vw - 48px");
    max-width: calc(~"100vw - 48px");
    height: calc(~"75vh - 40px");
    max-height: calc(~"75vh - 40px");
}
.full-tactical-target-view {
    width: calc(~"100vw - 48px");
    max-width: calc(~"100vw - 48px");
    height: calc(~"25vh - 40px");
    max-height: calc(~"25vh - 40px");
}

.column-view {
    width: calc(~"100vw - 500px");
    max-width: calc(~"100vw - 500px");
    height: calc(~"50vh - 40px");
    max-height: calc(~"50vh - 40px");
}
.row-view {
    width: calc(~"50vw - 250px");
    max-width: calc(~"50vw - 250px");
    height: calc(~"100vh - 80px");
    max-height: calc(~"100vh - 80px");
}
.overlap-view {
    width: calc(~"100vw - 500px");
    max-width: calc(~"100vw - 500px");
    height: calc(~"100vh - 80px");
    max-height: calc(~"100vh - 80px");
}
.tactical-current-view {
    width: calc(~"100vw - 500px");
    max-width: calc(~"100vw - 500px");
    height: calc(~"75vh - 40px");
    max-height: calc(~"75vh - 40px");
}
.tactical-target-view {
    width: calc(~"100vw - 500px");
    max-width: calc(~"100vw - 500px");
    height: calc(~"25vh - 40px");
    max-height: calc(~"25vh - 40px");
}
</style>