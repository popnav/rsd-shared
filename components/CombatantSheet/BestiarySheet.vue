<template>
    <div 
        class="d-flex flex-column bestiary-sheet alt-scrollbar pa-2"
        v-if="!!visible && !!bestiary"
        :class="containerClass + (!!rsd.darkmode ? ' theme--dark' : '')"
    >

        <!-- Title -->
        <div class="d-flex flex-row align-center text-uppercase">
            <div class="d-flex flex-column">
                <span class="text-h6 roboto-condensed mb-n1">{{bestiary.name}}</span>
                <span class="text-subtitle-2 font-weight-regular icon_color--text mt-n1">
                    {{!!adjusted ? tindex.adj : ''}}
                    {{bestiary.type == 'Hazard' ? 'Hazard' : $rsd.format.capitalize($rsd.bestiary.getCreatureType(bestiary._id))}}
                </span>
            </div>
            <v-spacer></v-spacer>
            <div class="text-h6">
                <span class="mr-1">Creature</span>
                <span>{{!!bestiary.level || bestiary.level == 0 ? bestiary.level + (modifier/2) : 0}}</span>
            </div>
        </div>

        <hr />

        <!-- Traits -->
        <div v-if="!!bestiary" class="flex-row flex-wrap my-1" :class="!!compact ? 'd-none' : 'd-flex'">
            <BaseTraitChip 
                v-if="!!bestiary.rarity" 
                :trait="bestiary.rarity" 
                :custom_class="$rsd.format.rarityColor(bestiary.rarity)" 
            />
            <BaseTraitChip
                v-for="trait in alignmentLikeTraits(bestiary.traits)"
                :key="'trait-'+trait"
                :trait="trait"
                :custom_class="$rsd.format.traitColor(trait)"
            />
            <BaseTraitChip :trait="bestiary.size" :custom_class="'green darken-1'" />
            <BaseTraitChip
                v-for="trait in otherTraits(bestiary.traits)"
                :key="'trait-'+trait" 
                :trait="trait"
                :custom_class="$rsd.format.traitColor(trait)"
            />
        </div>
        <!-- TODO: Add for PC's when able -->
        <div v-else class="my-1" :class="!!compact ? 'd-none' : 'd-flex'">
            <BaseTraitChip :trait="'Neutral'" :custom_class="$rsd.format.traitColor('Neutral')" />
            <BaseTraitChip :trait="'Medium'" :custom_class="'green darken-1'" />
            <BaseTraitChip :trait="'human'" :custom_class="$rsd.format.traitColor('human')" />
            <BaseTraitChip :trait="'humanoid'" :custom_class="$rsd.format.traitColor('humanoid')" />
        </div>

        <!-- Header text -->
        <div class="d-flex flex-column" v-if="!!bestiary">
            <span v-if="!!bestiary.source" v-show="!compact">
                <span class="font-weight-bold mr-1">Source</span>
                <span>{{bestiary.source}}</span>
            </span>
            <StatsPerception :perception="modifiedValue(bestiary.perception)" :senses="bestiary.senses" :cidentifier="bestiary.name" />
            <StatsLanguages :languages="bestiary.languages" v-show="!compact" />
            <StatsSkills :skills="modifiedArray(bestiary.skills)" :cidentifier="bestiary.name" />
            <StatsCore :core="bestiary.core" :cidentifier="bestiary.name" v-show="!compact" />
            <!-- TODO: Add items here? -->
        </div>

        <hr />

        <!-- Health info & defensive abilities -->
        <div class="d-flex flex-column" v-if="!!bestiary">
            <StatsSaves :stats="modifiedArray(bestiary.saves)" :cidentifier="bestiary.name" />
            <StatsHealthInfo :hpmax="modifiedHP(bestiary.hpmax)" :hpinfo="bestiary.hpinfo" />
            <div>
                <StatsActions :actions="bestiary.actions.defensive" />
            </div>
            <div class="d-flex flex-row flex-wrap my-1">
                <v-card  
                    v-for="(cvalue, cindex) in bestiary.conditions" 
                    :key="'condition-'+cindex" 
                    outlined
                    tile
                    @click="() => {}"
                >
                    <ConditionCard :condition="cvalue" :label="true" />
                </v-card>
            </div>
        </div>

        <hr />

        <!-- Offsensive abilities -->
        <div class="d-flex flex-column" v-if="!!bestiary">
            <StatsSpeeds :speeds="bestiary.speeds" v-show="!compact" />
            <StatsSpellcasting :casting="modifiedSpellcasting(bestiary.spellcasting)" :modified="adjusted" />
            <StatsAttacks :attacks="modifiedAttacks(bestiary.actions.attacks)" :cidentifier="bestiary.name" :modified="adjusted" />
            <StatsActions :actions="bestiary.actions.offensive" v-show="!compact" :modifier="modifier" />
        </div>

        <!-- <span>{{bestiary.object}}</span> -->
    </div>
</template>

<script>
import BaseTraitChip from '@root/.shared/components/base/BaseTraitChip'

import StatsPerception from './components/StatsPerception.vue'
import StatsLanguages from './components/StatsLanguages.vue'
import StatsSkills from './components/StatsSkills.vue'
import StatsCore from './components/StatsCore.vue'
import StatsSaves from './components/StatsSaves.vue'
import StatsHealthInfo from './components/StatsHealthInfo.vue'
import StatsActions from './components/StatsActions.vue'
import StatsSpeeds from './components/StatsSpeeds.vue'
import StatsAttacks from './components/StatsAttacks.vue'
import StatsSpellcasting from './components/StatsSpellcasting.vue'

import ConditionCard from './components/ConditionCard'

import AlignmentMixin from '@root/.shared/mixin/AlignmentMixin'

export default {
    mixins: [
        AlignmentMixin,
    ],
    components: {
        BaseTraitChip,
        ConditionCard,
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
    },
    props: {
        bestiary: Object,
        visible: Boolean,
        containerClass: String,
        compact: Boolean,
    },
    computed: {
        adjusted() {
            return !!this.tindex && !!this.tindex.adj && this.tindex.adj != 'normal'
        },
        modifier() {
            return !!this.adjusted ? (this.tindex.adj == 'weak' ? -2 : 2) : 0 
        },
    },
    methods: {
        modifiedValue(stat) {
            return this.modifier != 0 ? {
                modified:true, value: stat.value + this.modifier
            } : stat
        },
        modifiedArray(array) {
            if (this.modifier == 0) { return array }
            else {
                let modified = {}
                Object.keys(array).forEach(key => {
                    modified[key] = {value: array[key].value + this.modifier, modified: true}
                })

                return modified
            }
        },
        modifiedSpellcasting(array) {
            if (this.modifier == 0 || !array) { return array }
            else {
                let modified = JSON.parse(JSON.stringify(array))

                if (!!modified.entries && Object.keys(modified.entries).length > 0) {
                    modified.entries.forEach((value, index) => {
                        if (!!value && !!value.system) {
                            if (!!value.system.spelldc) {
                                if ((!!value.system.spelldc.dc || value.system.spelldc.dc == 0)) {
                                    value.system.spelldc.dc = array.entries[index].system.spelldc.dc + this.modifier
                                }
                                if ((!!value.system.spelldc.value || value.system.spelldc.value == 0)) {
                                    value.system.spelldc.value = array.entries[index].system.spelldc.value + this.modifier
                                }
                            }
                        }
                    })
                }

                return modified
            }
        },
        modifiedAttacks(array) {
            if (this.modifier == 0) { return array }
            else {
                let modified = JSON.parse(JSON.stringify(array))

                modified.forEach((value, index) => {
                    if (!!value && !!value.system) {
                        if (!!value.system.bonus && (!!value.system.bonus.value || value.system.bonus.value == 0)) {
                            value.system.bonus.value = array[index].system.bonus.value + this.modifier
                        }

                        if (!!value.system.damageRolls && Object.keys(value.system.damageRolls).length > 0) {
                            Object.keys(value.system.damageRolls).forEach(dkey => {
                                value.system.damageRolls[dkey].damage = array[index].system.damageRolls[dkey].damage + '+' + this.modifier.toString()
                            })
                        }
                    }
                })

                return modified
            }
        },
        modifiedHP(hpmax) {
            if (this.modifier == 0) {
                return hpmax
            } else if (this.modifier > 0) {
                let adjustment = 10
                if (this.bestiary.level >= 2 && this.bestiary.level <= 4) {
                    adjustment = 15
                } else if (this.bestiary.level >= 5 && this.bestiary.level <= 19) {
                    adjustment = 20
                } else if (this.bestiary.level >= 20) {
                    adjustment = 30
                }
                
                return {value: hpmax.value + adjustment, modified: true}
            } else {
                let adjustment = 0
                let modified = false
                if (this.bestiary.level >= 1 && this.bestiary.level <= 2) {
                    adjustment = -10
                    modified = true
                } else if (this.bestiary.level >= 3 && this.bestiary.level <= 5) {
                    adjustment = -15
                    modified = true
                }  else if (this.bestiary.level >= 6 && this.bestiary.level <= 20) {
                    adjustment = -20
                    modified = true
                } else if (this.bestiary.level >= 21) {
                    adjustment = -30
                    modified = true
                }

                return {value: hpmax.value + adjustment, modified: modified}
            }
        }
    }
}
</script>

<style lang="less" scoped>
.bestiary-sheet {
    overflow-y: scroll;
    overflow-x: clip;
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

.mobile-view {
    width: 100%;
    max-width: 100%;
    height: calc(~"100vh - 144px");
    max-height: calc(~"100vh - 144px");
}
</style>