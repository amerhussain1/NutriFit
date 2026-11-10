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
    'GenderSelectionScreen'
>;
const { width, height } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
const GenderSelectionScreen = () => {
    const navigation = useNavigation<NavProps>();
    const [selectedGender, setSelectedGender] = useState<'Male' | 'Female'>('Male');
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFDFB" />
            {/* Soft Luxury Warm Background Base */}
            <LinearGradient colors={['#FFFDFB', '#FDF5EC', '#F5EBE0']} style={styles.gradient}>
                {/* Custom Styled Header Area */}
                <View style={styles.headerStack}>
                    <AppBar title="Gender Selection" />
                    <ProgressSteps totalSteps={7} currentStep={1} />
                </View>
                {/* Hero Context Typography */}
                <View style={styles.heroTextContainer}>
                    {/* <View style={styles.aiBadge}>
                        <Text style={styles.aiBadgeText}>AI ENGINE V2.4</Text>
                    </View> */}
                    <Text style={styles.mainHeading}>Select Physical Identity</Text>
                    <Text style={styles.subHeading}>
                        Our neural network benchmarks macro distributions and daily caloric burn calculations off your physiological profile.
                    </Text>
                </View>
                {/* Overhauled Split Dynamic Selector System */}
                <View style={styles.selectionTrack}>
                    {/* Premium Male Slate */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setSelectedGender('Male')}
                        style={[
                            styles.cardBase,
                            selectedGender === 'Male' ? styles.maleActiveBorder : styles.inactiveBorder,
                        ]}
                    >
                        <View style={styles.cardContent}>
                            {/* Accent Top Dot Indicator */}
                            <View style={[styles.indicatorDot, selectedGender === 'Male' && styles.maleDotActive]} />
                            {/* Elevated Image Asset Container */}
                            <View style={[
                                styles.avatarWrapper,
                                selectedGender === 'Male' ? styles.maleAvatarBg : styles.defaultAvatarBg
                            ]}>
                                <Image
                                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }}
                                    style={styles.avatarImage}
                                />
                            </View>
                            <Text style={[
                                styles.genderLabelText,
                                selectedGender === 'Male' && styles.maleTextActive
                            ]}>
                                Male
                            </Text>
                            {/* Micro-Features Metadata Blocks */}
                            <View style={styles.metaTraitsContainer}>
                                <Text style={styles.traitPill}>⚡ Lean Mass Focus</Text>
                                <Text style={styles.traitPill}>🔋 Higher Power BMR</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                    {/* Premium Female Slate */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setSelectedGender('Female')}
                        style={[
                            styles.cardBase,
                            selectedGender === 'Female' ? styles.femaleActiveBorder : styles.inactiveBorder,
                        ]}
                    >
                        <View style={styles.cardContent}>
                            {/* Accent Top Dot Indicator */}
                            <View style={[styles.indicatorDot, selectedGender === 'Female' && styles.femaleDotActive]} />
                            {/* Elevated Image Asset Container */}
                            <View style={[
                                styles.avatarWrapper,
                                selectedGender === 'Female' ? styles.femaleAvatarBg : styles.defaultAvatarBg
                            ]}>
                                <Image
                                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6997/6997662.png' }}
                                    style={styles.avatarImage}
                                />
                            </View>
                            <Text style={[
                                styles.genderLabelText,
                                selectedGender === 'Female' && styles.femaleTextActive
                            ]}>
                                Female
                            </Text>
                            {/* Micro-Features Metadata Blocks */}
                            <View style={styles.metaTraitsContainer}>
                                <Text style={styles.traitPill}>✨ Metabolic Tone</Text>
                                <Text style={styles.traitPill}>🧬 Hormone Harmony</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
                {/* Contextual Realtime Notification Banner */}
                <LinearGradient
                    colors={['#1E1E24', '#121215']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.toastBanner}
                >
                    <Text style={styles.toastIcon}>🧬</Text>
                    <View style={styles.toastTextFrame}>
                        <Text style={styles.toastMainText}>
                            Selected path scales personalized macros up to <Text style={styles.highlightText}>34% more accurately</Text> than traditional generic tracking frameworks.
                        </Text>
                    </View>
                </LinearGradient>
                {/* Persistent Dynamic Interaction Button */}
                <View style={styles.actionFooter}>
                    <TouchableOpacity
                        activeOpacity={0.88}
                        style={styles.actionButtonContainer}
                        onPress={() => navigation.navigate('WeightSelectionScreen')}
                    >
                        <LinearGradient
                            colors={selectedGender === 'Male' ? ['#FF5E00', '#FF9100'] : ['#E63956', '#FF708A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.interactiveButton}
                        >
                            <Text style={styles.actionButtonText}>Continue</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
};
export default GenderSelectionScreen;
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
        fontWeight: '400',
    },
    selectionTrack: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: hp(4),
    },
    cardBase: {
        width: '48%',
        borderRadius: wp(6),
        backgroundColor: '#FFFFFF',
        shadowColor: '#1F1100',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.06,
        shadowRadius: 24,
        elevation: 4,
        borderWidth: 2.5,
    },
    inactiveBorder: {
        borderColor: '#F3F4F6',
    },
    maleActiveBorder: {
        borderColor: '#FF5E00',
        transform: [{ scale: 1.025 }],
    },
    femaleActiveBorder: {
        borderColor: '#E63956',
        transform: [{ scale: 1.025 }],
    },
    cardContent: {
        paddingVertical: hp(3),
        paddingHorizontal: wp(3.5),
        alignItems: 'center',
        position: 'relative',
    },
    indicatorDot: {
        width: wp(2.5),
        height: wp(2.5),
        borderRadius: wp(1.25),
        backgroundColor: '#E5E7EB',
        position: 'absolute',
        top: hp(2),
        right: wp(4),
    },
    maleDotActive: {
        backgroundColor: '#FF5E00',
    },
    femaleDotActive: {
        backgroundColor: '#E63956',
    },
    avatarWrapper: {
        width: wp(20),
        height: wp(20),
        borderRadius: wp(5),
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp(1),
        marginBottom: hp(2.5),
    },
    defaultAvatarBg: {
        backgroundColor: '#F9FAFB',
    },
    maleAvatarBg: {
        backgroundColor: '#FFF1E7',
    },
    femaleAvatarBg: {
        backgroundColor: '#FFF0F2',
    },
    avatarImage: {
        width: wp(13),
        height: wp(13),
        resizeMode: 'contain',
    },
    genderLabelText: {
        fontSize: wp(5.2),
        fontWeight: '800',
        color: '#374151',
    },
    maleTextActive: {
        color: '#FF5E00',
    },
    femaleTextActive: {
        color: '#E63956',
    },
    metaTraitsContainer: {
        marginTop: hp(2),
        width: '100%',
        gap: hp(0.8),
    },
    traitPill: {
        backgroundColor: '#F3F4F6',
        color: '#4B5563',
        fontSize: wp(2.8),
        fontWeight: '600',
        paddingVertical: hp(0.6),
        paddingHorizontal: wp(2),
        borderRadius: wp(2),
        textAlign: 'center',
        overflow: 'hidden',
    },
    toastBanner: {
        flexDirection: 'row',
        paddingVertical: hp(2),
        paddingHorizontal: wp(4.5),
        borderRadius: wp(5),
        alignItems: 'center',
        marginTop: hp(4),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 5,
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
        fontSize: wp(3.2),
        lineHeight: hp(2.1),
        fontWeight: '500',
    },
    highlightText: {
        color: '#FFF',
        fontWeight: '700',
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