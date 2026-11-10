import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AppBar from '../Component/AppBar';
import ProgressSteps from '../Component/ProgressSteps';
type NavProps = NativeStackNavigationProp<
    RootStackParamList,
    'GoalSelectionScreen'
>;
const { width, height } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
type GoalType = 'Loss' | 'Gain' | 'Maintain';
const GoalSelectionScreen = () => {
    const navigation = useNavigation<NavProps>();
    const [selectedGoal, setSelectedGoal] = useState<GoalType>('Loss');
    const goals = [
        {
            id: 'Loss' as GoalType,
            title: 'Weight Loss',
            subtitle: 'Caloric Deficit Blueprint',
            desc: 'Optimizes fat oxidation while protecting core lean muscle mass.',
            badge: '🔥 Burn Fat',
            icon: 'https://cdn-icons-png.flaticon.com/512/10344/10344214.png',
        },
        {
            id: 'Gain' as GoalType,
            title: 'Weight Gain',
            subtitle: 'Caloric Surplus Framework',
            desc: 'Maximizes protein synthesis and clean muscular hypertrophy.',
            badge: '💪 Build Mass',
            icon: 'https://cdn-icons-png.flaticon.com/512/3041/3041210.png',
        },
        {
            id: 'Maintain' as GoalType,
            title: 'Maintain & Tone',
            subtitle: 'Metabolic Equilibrium',
            desc: 'Fine-tunes body composition and enhances overall daily vitality.',
            badge: '✨ Clean Energy',
            icon: 'https://cdn-icons-png.flaticon.com/512/4710/4710639.png',
        },
    ];
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFDFB" />
            <LinearGradient colors={['#FFFDFB', '#FDF5EC', '#F5EBE0']} style={styles.gradient}>
                {/* Header Stack */}
                <View style={styles.headerStack}>
                    <AppBar title="Choose Strategy" />
                    <ProgressSteps totalSteps={7} currentStep={5} />
                </View>
                {/* Hero Target Typography */}
                <View style={styles.heroTextContainer}>
                    <View style={styles.aiBadge}>
                        <Text style={styles.aiBadgeText}>TARGET OBJECTIVE</Text>
                    </View>
                    <Text style={styles.mainHeading}>What’s Your Primary Aim?</Text>
                    <Text style={styles.subHeading}>
                        Your choice re-calibrates target thermic thresholds and updates biochemical allocation calculations.
                    </Text>
                </View>
                {/* Elite Vertical Stack Track */}
                <View style={styles.goalsTrack}>
                    {goals.map((item) => {
                        const isSelected = selectedGoal === item.id;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.9}
                                onPress={() => setSelectedGoal(item.id)}
                                style={[
                                    styles.goalCard,
                                    isSelected ? styles.activeCardBorder : styles.inactiveCardBorder
                                ]}
                            >
                                <View style={[
                                    styles.avatarWrapper,
                                    isSelected ? styles.avatarBgActive : styles.avatarBgDefault
                                ]}>
                                    <Image source={{ uri: item.icon }} style={styles.avatarImage} />
                                </View>
                                <View style={styles.cardMainBody}>
                                    <View style={styles.cardHeaderRow}>
                                        <Text style={[styles.goalTitle, isSelected && styles.activeText]}>
                                            {item.title}
                                        </Text>
                                        <Text style={[styles.metaBadge, isSelected ? styles.badgeActive : styles.badgeDefault]}>
                                            {item.badge}
                                        </Text>
                                    </View>
                                    <Text style={styles.goalSubtitle}>{item.subtitle}</Text>
                                    <Text style={styles.goalDesc}>{item.desc}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                {/* AI Predictive Strategy Notice */}
                <LinearGradient
                    colors={['#1E1E24', '#121215']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.toastBanner}
                >
                    <Text style={styles.toastIcon}>🎯</Text>
                    <View style={styles.toastTextFrame}>
                        <Text style={styles.toastMainText}>
                            The AI engine adjusts baseline nutritional dynamic limits based on this vector to avoid metabolic adaptation plateaus.
                        </Text>
                    </View>
                </LinearGradient>
                {/* Persistent Action Footer */}
                <View style={styles.actionFooter}>
                    <TouchableOpacity
                        activeOpacity={0.88}
                        style={styles.actionButtonContainer}
                        onPress={() => navigation.navigate('BudgetSelectionScreen')}
                    >
                        <LinearGradient
                            colors={['#FF5E00', '#FF9100']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.interactiveButton}
                        >
                            <Text style={styles.actionButtonText}>Confirm Strategy Selection →</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
};
export default GoalSelectionScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFDFB',
    },
    gradient: {
        flex: 1,
        paddingHorizontal: wp(5.5),
    },
    headerStack: {
        marginTop: hp(0.5),
    },
    progressWrapper: {
        marginTop: hp(-1),
        marginBottom: hp(1),
    },
    heroTextContainer: {
        marginTop: hp(2.5),
        alignItems: 'flex-start',
    },
    aiBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.5),
        borderRadius: wp(1.5),
        marginBottom: hp(1.5),
    },
    aiBadgeText: {
        fontSize: wp(2.8),
        fontWeight: '700',
        color: '#4B5563',
        letterSpacing: 1,
    },
    mainHeading: {
        fontSize: wp(7.8),
        fontWeight: '900',
        color: '#111827',
        letterSpacing: -0.8,
    },
    subHeading: {
        marginTop: hp(1.2),
        fontSize: wp(3.7),
        color: '#6B7280',
        lineHeight: hp(2.4),
    },
    goalsTrack: {
        marginTop: hp(3.5),
        gap: hp(1.8),
    },
    goalCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: wp(5.5),
        paddingVertical: hp(2),
        paddingHorizontal: wp(4),
        alignItems: 'center',
        borderWidth: 2.5,
        shadowColor: '#1F1100',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 3,
    },
    inactiveCardBorder: {
        borderColor: '#F3F4F6',
    },
    activeCardBorder: {
        borderColor: '#FF5E00',
        transform: [{ scale: 1.02 }],
    },
    avatarWrapper: {
        width: wp(16),
        height: wp(16),
        borderRadius: wp(4.5),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(4),
    },
    avatarBgDefault: {
        backgroundColor: '#F9FAFB',
    },
    avatarBgActive: {
        backgroundColor: '#FFF1E7',
    },
    avatarImage: {
        width: wp(11),
        height: wp(11),
        resizeMode: 'contain',
    },
    cardMainBody: {
        flex: 1,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    goalTitle: {
        fontSize: wp(4.6),
        fontWeight: '800',
        color: '#111827',
    },
    activeText: {
        color: '#FF5E00',
    },
    metaBadge: {
        fontSize: wp(2.8),
        fontWeight: '700',
        paddingVertical: hp(0.4),
        paddingHorizontal: wp(2.2),
        borderRadius: wp(10),
        overflow: 'hidden',
    },
    badgeDefault: {
        backgroundColor: '#F3F4F6',
        color: '#6B7280',
    },
    badgeActive: {
        backgroundColor: '#FFF1E7',
        color: '#FF5E00',
    },
    goalSubtitle: {
        fontSize: wp(3),
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginTop: hp(0.2),
    },
    goalDesc: {
        fontSize: wp(3.1),
        color: '#6B7280',
        marginTop: hp(0.6),
        lineHeight: hp(1.8),
        fontWeight: '500',
    },
    toastBanner: {
        flexDirection: 'row',
        paddingVertical: hp(1.8),
        paddingHorizontal: wp(4.5),
        borderRadius: wp(5),
        alignItems: 'center',
        marginTop: hp(3.5),
    },
    toastIcon: {
        fontSize: wp(5.5),
        marginRight: wp(3.5),
    },
    toastTextFrame: {
        flex: 1,
    },
    toastMainText: {
        color: '#9CA3AF',
        fontSize: wp(3.1),
        lineHeight: hp(2),
        fontWeight: '500',
    },
    actionFooter: {
        position: 'absolute',
        bottom: hp(4.5),
        left: wp(5.5),
        right: wp(5.5),
    },
    actionButtonContainer: {
        width: '100%',
        shadowColor: '#FF5E00',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    interactiveButton: {
        paddingVertical: hp(2.2),
        borderRadius: wp(5),
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: wp(4.2),
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});