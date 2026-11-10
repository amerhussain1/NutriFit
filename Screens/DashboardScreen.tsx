import React from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    FlatList,
    Image,
    ScrollView,
    Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
const { width, height } = Dimensions.get("window");
// Responsive helpers
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;
const DashboardScreen = ({ navigation }: any) => {
    const meals = [
        { id: 1, name: "Chicken Biryani", time: "12:30 PM", kcal: 450 },
        { id: 2, name: "Apple", time: "10:00 AM", kcal: 80 },
    ];
    const NavItem = ({ icon, label, active }: any) => {
        return (
            <TouchableOpacity style={styles.navItem}>
                <Ionicons
                    name={icon}
                    size={wp(6)}
                    color={active ? "#FF7A00" : "#9CA3AF"}
                />
                <Text
                    style={[
                        styles.navLabel,
                        { color: active ? "#FF7A00" : "#9CA3AF" },
                    ]}
                >
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF7ED" />
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: hp(10) }}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity>
                        <Ionicons name="menu" size={wp(7)} color="#111827" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Ionicons name="notifications-outline" size={wp(6.5)} color="#111827" />
                    </TouchableOpacity>
                </View>
                {/* USER SECTION */}
                <View style={styles.userRow}>
                    <Image
                        source={require('../assets/Amer.jpeg')}
                        style={styles.avatar}
                    />
                    <View style={{ marginLeft: wp(3) }}>
                        <Text style={styles.greeting}>Hi, Amer 👋</Text>
                        <Text style={styles.subText}>
                            Let’s make healthy & budget
                        </Text>
                        <Text style={styles.subText}>friendly choices today!</Text>
                    </View>
                </View>
                {/* CALORIE CARD */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Daily Calorie Goal</Text>
                        <Text style={styles.kcalText}>1800 kcal</Text>
                    </View>
                    <Text style={styles.calorieMain}>
                        1250 <Text style={styles.small}>/ 1800 kcal</Text>
                    </Text>
                    <View style={styles.progressBg}>
                        <View style={styles.progressFill} />
                    </View>
                    <Text style={styles.percent}>70%</Text>
                </View>
                {/* MACROS */}
                <View style={styles.row}>
                    <View style={styles.macroCard}>
                        <Text style={styles.macroTitle}>Protein</Text>
                        <Text style={styles.macroValue}>65g / 120g</Text>
                        <View style={[styles.miniBar, { backgroundColor: "#F97316" }]} />
                    </View>
                    <View style={styles.macroCard}>
                        <Text style={styles.macroTitle}>Carbs</Text>
                        <Text style={styles.macroValue}>160g / 250g</Text>
                        <View style={[styles.miniBar, { backgroundColor: "#FBBF24" }]} />
                    </View>
                    <View style={styles.macroCard}>
                        <Text style={styles.macroTitle}>Fats</Text>
                        <Text style={styles.macroValue}>45g / 70g</Text>
                        <View style={[styles.miniBar, { backgroundColor: "#3B82F6" }]} />
                    </View>
                </View>
                {/* SCAN FOOD CARD */}
                <LinearGradient
                    colors={["#FF7A00", "#FFC837"]}
                    style={styles.scanCard}
                >
                    <Ionicons name="camera" size={wp(8)} color="#fff" />
                    <View style={{ marginLeft: wp(3) }}>
                        <Text style={styles.scanTitle}>Scan Your Food</Text>
                        <Text style={styles.scanSub}>Take a photo & analyze</Text>
                    </View>
                </LinearGradient>
                {/* BUDGET CARD */}
                <View style={styles.budgetCard}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Ionicons
                                name="wallet-outline"
                                size={wp(5.5)}
                                color="#FF7A00"
                            />
                            <Text style={[styles.budgetTitle, { marginLeft: wp(2) }]}>
                                Budget Diet Plan
                            </Text>
                        </View>
                        <Text style={styles.budgetText}>
                            Your budget: 150 / day
                        </Text>
                        <Text style={styles.budgetText}>
                            Recommended daily plan
                        </Text>
                        <TouchableOpacity style={styles.planBtn}>
                            <Text style={styles.planText}>View Plan</Text>
                        </TouchableOpacity>
                    </View>
                    <Image
                        source={{
                            uri: "https://cdn-icons-png.flaticon.com/512/2909/2909765.png",
                        }}
                        style={styles.foodImg}
                    />
                </View>
                {/* RECENT MEALS */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Meals</Text>
                    <Text style={styles.seeAll}>See All</Text>
                </View>
                {meals.map((item) => (
                    <View key={item.id} style={styles.mealCard}>
                        <View>
                            <Text style={styles.mealName}>{item.name}</Text>
                            <Text style={styles.mealTime}>{item.time}</Text>
                        </View>
                        <Text style={styles.mealKcal}>{item.kcal} kcal</Text>
                    </View>
                ))}
                {/* BOTTOM NAVIGATION */}
                <View style={styles.bottomNav}>
                    <NavItem icon="home" label="Home" active />
                    <NavItem icon="time" label="History" />
                    <NavItem icon="restaurant" label="Plan" />
                    <NavItem icon="bar-chart" label="Stats" />
                    <NavItem icon="person" label="Profile" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
export default DashboardScreen;
/* ================= STYLES ================= */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF7ED",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: wp(5),
        paddingTop: hp(2),
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp(5),
        marginTop: hp(2),
    },
    avatar: {
        width: wp(50),
        height: wp(50),
        borderRadius: wp(7),
    },
    greeting: {
        fontSize: wp(5),
        fontWeight: "800",
        color: "#111827",
    },
    subText: {
        fontSize: wp(3.5),
        color: "#6B7280",
        marginTop: 2,
        width: wp(70),
    },
    card: {
        backgroundColor: "#fff",
        marginHorizontal: wp(5),
        marginTop: hp(3),
        borderRadius: wp(5),
        padding: wp(5),
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cardTitle: {
        fontSize: wp(4),
        fontWeight: "700",
        color: "#111827",
    },
    kcalText: {
        fontSize: wp(3.8),
        color: "#6B7280",
    },
    calorieMain: {
        fontSize: wp(9),
        fontWeight: "900",
        marginTop: hp(1),
        color: "#111827",
    },
    small: {
        fontSize: wp(4),
        color: "#6B7280",
    },
    progressBg: {
        height: hp(1.2),
        backgroundColor: "#FDE68A",
        borderRadius: 10,
        marginTop: hp(2),
    },
    progressFill: {
        width: "70%",
        height: "100%",
        backgroundColor: "#22C55E",
        borderRadius: 10,
    },
    percent: {
        marginTop: hp(1),
        fontWeight: "700",
        color: "#16A34A",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: wp(5),
        marginTop: hp(2),
    },
    macroCard: {
        width: "31%",
        backgroundColor: "#fff",
        padding: wp(3),
        borderRadius: wp(4),
        alignItems: "center",
    },
    macroTitle: {
        fontSize: wp(3.5),
        fontWeight: "700",
    },
    macroValue: {
        fontSize: wp(3),
        color: "#6B7280",
        marginVertical: 4,
    },
    miniBar: {
        width: "80%",
        height: 4,
        borderRadius: 10,
        marginTop: 5,
    },
    scanCard: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: wp(5),
        marginTop: hp(3),
        padding: wp(5),
        borderRadius: wp(5),
    },
    scanTitle: {
        color: "#fff",
        fontSize: wp(4.5),
        fontWeight: "800",
    },
    scanSub: {
        color: "#fff",
        fontSize: wp(3.5),
    },
    budgetCard: {
        flexDirection: "row",
        backgroundColor: "#fff",
        marginHorizontal: wp(5),
        marginTop: hp(3),
        padding: wp(5),
        borderRadius: wp(5),
        alignItems: "center",
    },
    budgetTitle: {
        fontSize: wp(4.5),
        fontWeight: "800",
        color: "#111827",
    },
    budgetText: {
        fontSize: wp(3.5),
        color: "#6B7280",
        marginTop: 3,
    },
    planBtn: {
        marginTop: hp(1.5),
        backgroundColor: "#FF7A00",
        padding: wp(2),
        borderRadius: 10,
        alignSelf: "flex-start",
    },
    planText: {
        color: "#fff",
        fontWeight: "700",
    },
    foodImg: {
        width: wp(18),
        height: wp(18),
        marginLeft: wp(3),
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: wp(5),
        marginTop: hp(3),
    },
    sectionTitle: {
        fontSize: wp(4.5),
        fontWeight: "800",
    },
    seeAll: {
        color: "#FF7A00",
        fontWeight: "700",
    },
    mealCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: wp(5),
        marginTop: hp(2),
        backgroundColor: "#fff",
        padding: wp(4),
        borderRadius: wp(4),
    },
    mealName: {
        fontWeight: "700",
        color: "#111827",
    },
    mealTime: {
        color: "#6B7280",
        fontSize: wp(3),
    },
    mealKcal: {
        fontWeight: "700",
        color: "#FF7A00",
    },
    bottomNav: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.5),
        backgroundColor: "#fff",
        borderTopLeftRadius: wp(5),
        borderTopRightRadius: wp(5),
        position: "absolute",
        bottom: 0,
        width: "100%",
        elevation: 10,
    },
    navItem: {
        alignItems: "center",
        justifyContent: "center",
    },
    navLabel: {
        fontSize: wp(3),
        marginTop: 3,
    },
});