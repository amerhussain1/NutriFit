import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { Dimensions } from "react-native";
const { width, height } = Dimensions.get("window");
// Responsive helpers (same as your screen)
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
type AppBarProps = {
    title?: string;
};
const AppBar: React.FC<AppBarProps> = ({ title = "Your Body Analysis" }) => {
    const navigation = useNavigation();
    return (
        <View style={styles.header}>
            {/* Left icon (fixed left) */}
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.7}
            >
                <Ionicons
                    name="chevron-back"
                    size={wp(7)}
                    color="#111827"
                />
            </TouchableOpacity>
            {/* Center title */}
            <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>{title}</Text>
            </View>
            {/* Right spacer (keeps title centered) */}
            <View style={styles.rightSpace} />
        </View>
    );
};
export default AppBar;
const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp(5),
        paddingTop: hp(2),
        paddingBottom: hp(1.5),
        // backgroundColor: "#FFFFFF",
        // // shadow (iOS + Android)
        // shadowColor: "#000",
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.08,
        // shadowRadius: 6,
        // elevation: 4,
    },
    backButton: {
        width: wp(10),
        height: wp(10),
        borderRadius: wp(5),
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: wp(5),
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
    },
    titleContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    rightSpace: {
        width: wp(10), // same width as icon container
    },
});