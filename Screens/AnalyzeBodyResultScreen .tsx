import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AppBar from '../Component/AppBar';
import ProgressSteps from '../Component/ProgressSteps';
type NavProps = NativeStackNavigationProp<
    RootStackParamList,
    'AnalyzeBodyResultScreen'
>;
const { width, height } = Dimensions.get('window');
// Responsive Helpers
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
const AnalyzeBodyResultScreen = () => {
           const navigation = useNavigation<NavProps>();
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#FFF8F1"
            />
            <LinearGradient
                colors={['#FFF8F1', '#FFF4E6', '#FFFBEA']}
                style={styles.gradient}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingBottom: hp(5),
                    }}
                >
                    {/* Header */}
                    <AppBar title="Your Body Analysis" />
                    <ProgressSteps
                        totalSteps={7}
                        currentStep={7}
                    />
                    {/* AI Circle */}
                    <View style={styles.aiWrapper}>
                        <LinearGradient
                            colors={['#FFEDD5', '#FFF7ED']}
                            style={styles.aiCircle}
                        >
                            <View style={styles.aiInner}>
                                <Ionicons
                                    name="sparkles"
                                    size={wp(14)}
                                    color="#FF7A00"
                                />
                            </View>
                        </LinearGradient>
                    </View>
                    {/* Main Title */}
                    <Text style={styles.mainTitle}>
                        Analysis Complete!
                    </Text>
                    <Text style={styles.subtitle}>
                        Here's what our AI found about your body.
                    </Text>
                    {/* BMI Card */}
                    <View style={styles.statsCard}>
                        {/* Left */}
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>
                                BMI
                            </Text>
                            <Text style={styles.statValue}>
                                21.2
                            </Text>
                            <Text style={styles.greenText}>
                                Normal
                            </Text>
                        </View>
                        {/* Divider */}
                        <View style={styles.divider} />
                        {/* Right */}
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>
                                Body Condition
                            </Text>
                            <View style={styles.conditionRow}>
                                <View style={styles.greenBadge}>
                                    <Ionicons
                                        name="heart"
                                        size={wp(4)}
                                        color="#FFFFFF"
                                    />
                                </View>
                                <View>
                                    <Text style={styles.conditionText}>
                                        Healthy
                                    </Text>
                                    <Text style={styles.conditionSub}>
                                        Great job!
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    {/* Overview Card */}
                    <View style={styles.overviewCard}>
                        <Text style={styles.overviewTitle}>
                            Overview
                        </Text>
                        <Text style={styles.overviewText}>
                            Your body is in good shape! You have a
                            healthy BMI and overall balanced metrics.
                        </Text>
                        {/* Metrics */}
                        <View style={styles.metricRow}>
                            <View style={styles.metricLeft}>
                                <View style={styles.iconCircle}>
                                    <Ionicons
                                        name="fitness"
                                        size={wp(4.5)}
                                        color="#FF7A00"
                                    />
                                </View>
                                <Text style={styles.metricText}>
                                    Ideal Weight Range
                                </Text>
                            </View>
                            <Text style={styles.metricValue}>
                                58.0 - 78.0 kg
                            </Text>
                        </View>
                        <View style={styles.metricRow}>
                            <View style={styles.metricLeft}>
                                <View style={styles.iconCircle}>
                                    <Ionicons
                                        name="flash"
                                        size={wp(4.5)}
                                        color="#FF7A00"
                                    />
                                </View>
                                <Text style={styles.metricText}>
                                    Metabolic Age
                                </Text>
                            </View>
                            <Text style={styles.metricValue}>
                                22 Years
                            </Text>
                        </View>
                        <View style={styles.metricRow}>
                            <View style={styles.metricLeft}>
                                <View style={styles.iconCircle}>
                                    <Ionicons
                                        name="water"
                                        size={wp(4.5)}
                                        color="#FF7A00"
                                    />
                                </View>
                                <Text style={styles.metricText}>
                                    Body Fat Estimate
                                </Text>
                            </View>
                            <Text style={styles.metricValue}>
                                18 - 22 %
                            </Text>
                        </View>
                    </View>
                    {/* AI Recommendation */}
                    <View style={styles.recommendationCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.recommendTitle}>
                                AI Recommendation
                            </Text>
                            <Text style={styles.recommendText}>
                                You're doing great! A balanced diet
                                and regular exercise will help you
                                maintain this healthy condition.
                            </Text>
                        </View>
                        <View style={styles.starCircle}>
                            <Ionicons
                                name="star"
                                size={wp(7)}
                                color="#FFB300"
                            />
                        </View>
                    </View>
                    {/* Button */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={styles.buttonContainer}
                        onPress={() => navigation.navigate('DashboardScreen')}
                    >
                        <LinearGradient
                            colors={['#FF7A00', '#FFC837']}
                            style={styles.button}
                        >
                            <Text style={styles.buttonText}>
                                Continue to Dashboard
                            </Text>
                            <Ionicons
                                name="arrow-forward"
                                size={wp(5)}
                                color="#FFFFFF"
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
};
export default AnalyzeBodyResultScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF8F1',
    },
    gradient: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(5),
        marginTop: hp(2),
    },
    headerTitle: {
        fontSize: wp(4.8),
        fontWeight: '700',
        color: '#111827',
    },
    aiWrapper: {
        alignItems: 'center',
        marginTop: hp(4),
    },
    aiCircle: {
        width: wp(34),
        height: wp(34),
        borderRadius: wp(17),
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiInner: {
        width: wp(24),
        height: wp(24),
        borderRadius: wp(12),
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF7A00',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    mainTitle: {
        marginTop: hp(3),
        textAlign: 'center',
        fontSize: wp(7),
        fontWeight: '800',
        color: '#111827',
    },
    subtitle: {
        marginTop: hp(1),
        textAlign: 'center',
        fontSize: wp(3.8),
        color: '#6B7280',
        paddingHorizontal: wp(10),
        lineHeight: hp(2.8),
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginHorizontal: wp(5),
        marginTop: hp(4),
        borderRadius: wp(5),
        paddingVertical: hp(3),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    statBox: {
        flex: 1,
        paddingHorizontal: wp(4),
    },
    divider: {
        width: 1,
        backgroundColor: '#F3F4F6',
    },
    statLabel: {
        color: '#6B7280',
        fontSize: wp(3.5),
        marginBottom: hp(1),
    },
    statValue: {
        fontSize: wp(9),
        fontWeight: '800',
        color: '#111827',
    },
    greenText: {
        color: '#16A34A',
        fontWeight: '700',
        fontSize: wp(4),
    },
    conditionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(1),
    },
    greenBadge: {
        width: wp(10),
        height: wp(10),
        borderRadius: wp(5),
        backgroundColor: '#22C55E',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    conditionText: {
        fontSize: wp(4.5),
        fontWeight: '700',
        color: '#16A34A',
    },
    conditionSub: {
        fontSize: wp(3.3),
        color: '#6B7280',
    },
    overviewCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: wp(5),
        marginTop: hp(3),
        borderRadius: wp(5),
        padding: wp(5),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    overviewTitle: {
        fontSize: wp(4.5),
        fontWeight: '700',
        color: '#111827',
    },
    overviewText: {
        marginTop: hp(1),
        color: '#6B7280',
        fontSize: wp(3.5),
        lineHeight: hp(2.8),
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: hp(3),
    },
    metricLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: wp(9),
        height: wp(9),
        borderRadius: wp(4.5),
        backgroundColor: '#FFF4E6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(3),
    },
    metricText: {
        fontSize: wp(3.7),
        color: '#374151',
        fontWeight: '500',
    },
    metricValue: {
        fontSize: wp(3.5),
        color: '#111827',
        fontWeight: '700',
    },
    recommendationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        marginHorizontal: wp(5),
        marginTop: hp(3),
        borderRadius: wp(5),
        padding: wp(5),
    },
    recommendTitle: {
        color: '#16A34A',
        fontWeight: '700',
        fontSize: wp(4.2),
    },
    recommendText: {
        marginTop: hp(1),
        color: '#6B7280',
        fontSize: wp(3.4),
        lineHeight: hp(2.5),
        paddingRight: wp(2),
    },
    starCircle: {
        width: wp(14),
        height: wp(14),
        borderRadius: wp(7),
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        marginTop: hp(4),
        marginHorizontal: wp(5),
    },
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: hp(2.2),
        borderRadius: wp(10),
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: wp(4.2),
        fontWeight: '700',
        marginRight: wp(2),
    },
});