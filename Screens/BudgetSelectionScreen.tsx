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
    ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AppBar from '../Component/AppBar';
import ProgressSteps from '../Component/ProgressSteps';
import Ionicons from 'react-native-vector-icons/Ionicons'; 
type NavProps = NativeStackNavigationProp<
    RootStackParamList,
    'BudgetSelectionScreen'
>;
const { width, height } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
const BudgetSelectionScreen = () => {
    const navigation = useNavigation<NavProps>();
    const [selectedBudget, setSelectedBudget] =
        useState<number>(7500);
    const budgetPresets = [
        {
            label: 'Basic Diet',
            value: 5000,
            desc: 'Affordable healthy meals',
        },
        {
            label: 'Balanced Plan',
            value: 10000,
            desc: 'Premium proteins & fruits',
        },
        {
            label: 'Elite Fitness',
            value: 20000,
            desc: 'Supplements & organic foods',
        },
    ];
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#FFFCF8"
            />
            <LinearGradient
                colors={['#FFF8F1', '#FFF4E6', '#FFFBEA']}
                style={styles.gradient}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingBottom: hp(15),
                    }}
                >
                    {/* Header */}
                    <AppBar title="Budget Setup" />
                    {/* Progress */}
                    <ProgressSteps
                        totalSteps={7}
                        currentStep={6}
                    />
                    {/* Title */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>
                            Select Your Monthly Budget
                        </Text>
                        <Text style={styles.subtitle}>
                            AI will personalize your meals,
                            grocery lists, and diet plans
                            according to your budget
                        </Text>
                    </View>
                    {/* Main Budget Card */}
                    <View style={styles.mainCard}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={{
                                    uri: 'https://cdn-icons-png.flaticon.com/512/2454/2454269.png',
                                }}
                                style={styles.avatar}
                            />
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={styles.currency}>
                                PKR
                            </Text>
                            <Text style={styles.price}>
                                {selectedBudget.toLocaleString()}
                            </Text>
                        </View>
                        <Text style={styles.perMonth}>
                            Monthly Budget
                        </Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                ≈{' '}
                                {Math.round(
                                    selectedBudget / 30,
                                )}{' '}
                                PKR / day
                            </Text>
                        </View>
                    </View>
                    {/* Budget Presets */}
                    <View style={styles.presetContainer}>
                        {budgetPresets.map((item) => {
                            const isSelected =
                                selectedBudget === item.value;
                            return (
                                <TouchableOpacity
                                    key={item.value}
                                    activeOpacity={0.9}
                                    style={[
                                        styles.presetCard,
                                        isSelected &&
                                        styles.activePresetCard,
                                    ]}
                                    onPress={() =>
                                        setSelectedBudget(
                                            item.value,
                                        )
                                    }
                                >
                                    <View>
                                        <Text
                                            style={[
                                                styles.presetTitle,
                                                isSelected &&
                                                styles.activeText,
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                        <Text
                                            style={
                                                styles.presetDesc
                                            }
                                        >
                                            {item.desc}
                                        </Text>
                                    </View>
                                    <View
                                        style={
                                            styles.rightContent
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.presetValue,
                                                isSelected &&
                                                styles.activeText,
                                            ]}
                                        >
                                            {item.value.toLocaleString()}
                                        </Text>
                                        <View
                                            style={[
                                                styles.radioOuter,
                                                isSelected &&
                                                styles.radioOuterActive,
                                            ]}
                                        >
                                            {isSelected && (
                                                <View
                                                    style={
                                                        styles.radioInner
                                                    }
                                                />
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {/* Custom Slider Card */}
                    <View style={styles.customBudgetCard}>
                        <View style={styles.customHeader}>
                            <Text
                                style={styles.customTitle}
                            >
                                Custom Budget
                            </Text>
                            <View
                                style={styles.customBadge}
                            >
                                <Text
                                    style={
                                        styles.customBadgeText
                                    }
                                >
                                    AI Flexible
                                </Text>
                            </View>
                        </View>
                        {/* Value */}
                        <View
                            style={styles.customPriceRow}
                        >
                            <Text
                                style={
                                    styles.customCurrency
                                }
                            >
                                PKR
                            </Text>
                            <Text
                                style={styles.customPrice}
                            >
                                {selectedBudget.toLocaleString()}
                            </Text>
                        </View>
                        {/* Slider */}
                        <Slider
                            style={styles.slider}
                            minimumValue={5000}
                            maximumValue={30000}
                            step={500}
                            value={selectedBudget}
                            onValueChange={(value) =>
                                setSelectedBudget(value)
                            }
                            minimumTrackTintColor="#FF7A00"
                            maximumTrackTintColor="#E5E7EB"
                            thumbTintColor="#FF7A00"
                        />
                        {/* Labels */}
                        <View style={styles.sliderLabels}>
                            <Text
                                style={styles.sliderLabel}
                            >
                                5k
                            </Text>
                            <Text
                                style={styles.sliderLabel}
                            >
                                30k
                            </Text>
                        </View>
                        <Text
                            style={styles.sliderBottomText}
                        >
                            AI will optimize your diet,
                            groceries, and meal planning
                            according to this amount
                        </Text>
                    </View>
                    {/* Info Cards */}
                    <View style={styles.infoContainer}>
                        <View style={styles.infoCard}>
                            <Text style={styles.emoji}>
                                🥗
                            </Text>
                            <Text style={styles.infoTitle}>
                                Smart Meals
                            </Text>
                            <Text style={styles.infoDesc}>
                                Personalized healthy meal
                                combinations
                            </Text>
                        </View>
                        <View style={styles.infoCard}>
                            <Text style={styles.emoji}>
                                🛒
                            </Text>
                            <Text style={styles.infoTitle}>
                                Grocery AI
                            </Text>
                            <Text style={styles.infoDesc}>
                                AI optimized grocery budget
                                planning
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.buttonContainer}
                        onPress={() =>
                            navigation.navigate(
                                'AnalyzeBodyResultScreen',
                            )
                        }
                    >
                        <LinearGradient
                            colors={['#FF7A00', '#FFC837']}
                            style={styles.button}
                        >
                            <View style={styles.buttonContent}>
                                {/* AI Icon */}
                                <View style={styles.aiIconContainer}>
                                    <Ionicons
                                        name="sparkles"
                                        size={wp(5)}
                                        color="#FF7A00"
                                    />
                                </View>
                                {/* Text */}
                                <Text style={styles.buttonText}>
                                    Analyze My Body
                                </Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
                {/* Continue Button */}
            </LinearGradient>
        </SafeAreaView>
    );
};
export default BudgetSelectionScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFCF8',
    },
    gradient: {
        flex: 1,
        paddingHorizontal: wp(6),
    },
    headerContainer: {
        marginTop: hp(3),
        alignItems: 'center',
    },
    title: {
        fontSize: wp(7),
        fontWeight: '900',
        color: '#111827',
        textAlign: 'center',
    },
    subtitle: {
        marginTop: hp(1.5),
        fontSize: wp(3.8),
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: hp(2.6),
        paddingHorizontal: wp(2),
    },
    mainCard: {
        marginTop: hp(4),
        backgroundColor: '#FFFFFF',
        borderRadius: wp(7),
        paddingVertical: hp(4),
        paddingHorizontal: wp(6),
        alignItems: 'center',
    },
    avatarWrapper: {
        width: wp(20),
        height: wp(20),
        borderRadius: wp(10),
        backgroundColor: '#FFF1E7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    avatar: {
        width: wp(12),
        height: wp(12),
        resizeMode: 'contain',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    currency: {
        fontSize: wp(5),
        color: '#FF7A00',
        fontWeight: '700',
        marginBottom: hp(1),
        marginRight: wp(1),
    },
    price: {
        fontSize: wp(13),
        fontWeight: '900',
        color: '#111827',
    },
    perMonth: {
        marginTop: hp(1),
        color: '#6B7280',
        fontSize: wp(4),
        fontWeight: '600',
    },
    badge: {
        marginTop: hp(1.5),
        backgroundColor: '#FFEDD5',
        paddingHorizontal: wp(5),
        paddingVertical: hp(0.8),
        borderRadius: wp(10),
    },
    badgeText: {
        color: '#EA580C',
        fontWeight: '700',
        fontSize: wp(3.3),
    },
    presetContainer: {
        marginTop: hp(3),
        gap: hp(1.5),
    },
    presetCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: wp(5),
        paddingVertical: hp(2.2),
        paddingHorizontal: wp(4.5),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F3F4F6',
    },
    activePresetCard: {
        borderColor: '#FF7A00',
        transform: [{ scale: 1.01 }],
    },
    presetTitle: {
        fontSize: wp(4.3),
        fontWeight: '800',
        color: '#111827',
    },
    presetDesc: {
        fontSize: wp(3.1),
        color: '#9CA3AF',
        marginTop: hp(0.5),
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(3),
    },
    presetValue: {
        fontSize: wp(4.2),
        fontWeight: '800',
        color: '#4B5563',
    },
    activeText: {
        color: '#FF7A00',
    },
    radioOuter: {
        width: wp(5.5),
        height: wp(5.5),
        borderRadius: wp(3),
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterActive: {
        borderColor: '#FF7A00',
    },
    radioInner: {
        width: wp(2.7),
        height: wp(2.7),
        borderRadius: wp(1.35),
        backgroundColor: '#FF7A00',
    },
    customBudgetCard: {
        marginTop: hp(3),
        backgroundColor: '#FFFFFF',
        borderRadius: wp(6),
        paddingVertical: hp(3),
        paddingHorizontal: wp(5),
    },
    customHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    customTitle: {
        fontSize: wp(4.5),
        fontWeight: '800',
        color: '#111827',
    },
    customBadge: {
        backgroundColor: '#FFF1E7',
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.5),
        borderRadius: wp(3),
    },
    customBadgeText: {
        color: '#FF6B00',
        fontSize: wp(2.8),
        fontWeight: '700',
    },
    customPriceRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginTop: hp(2),
    },
    customCurrency: {
        fontSize: wp(5),
        color: '#FF7A00',
        fontWeight: '700',
        marginBottom: hp(1),
        marginRight: wp(1),
    },
    customPrice: {
        fontSize: wp(11),
        fontWeight: '900',
        color: '#111827',
    },
    slider: {
        width: '100%',
        height: hp(5),
        marginTop: hp(2),
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sliderLabel: {
        color: '#9CA3AF',
        fontSize: wp(3.1),
        fontWeight: '700',
    },
    sliderBottomText: {
        marginTop: hp(1.5),
        textAlign: 'center',
        color: '#6B7280',
        fontSize: wp(3.2),
        lineHeight: hp(2.2),
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: hp(4),
    },
    infoCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: wp(5),
        paddingVertical: hp(3),
        paddingHorizontal: wp(3),
        alignItems: 'center',
    },
    emoji: {
        fontSize: wp(9),
        marginBottom: hp(1),
    },
    infoTitle: {
        color: '#111827',
        fontSize: wp(4),
        fontWeight: '700',
        textAlign: 'center',
    },
    infoDesc: {
        color: '#6B7280',
        fontSize: wp(3.1),
        textAlign: 'center',
        marginTop: hp(1),
        lineHeight: hp(2.2),
    },
    buttonContainer: {
        position: 'absolute',
        bottom: hp(4),
        left: wp(6),
        right: wp(6),
    },
    button: {
        paddingVertical: hp(2.2),
        borderRadius: wp(5),
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: wp(4.5),
        fontWeight: '800',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiIconContainer: {
        width: wp(8),
        height: wp(8),
        borderRadius: wp(4),
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: wp(3),
    },
});