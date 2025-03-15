import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

interface BookingSlot {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  groundType: string;
  status: "pending" | "approved" | "rejected";
}

export default function AdminReports() {
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterType, setFilterType] = useState<"day" | "month" | "year">("day");
  const [reportData, setReportData] = useState({
    totalCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    pendingCount: 0,
    cricketCount: 0,
    footballCount: 0,
  });

  // Menu state and animation
  const [menuVisible, setMenuVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300)); // Start off-screen to the left

  useEffect(() => {
    fetchAllBookings();
  }, []);

  useEffect(() => {
    if (bookings.length > 0) {
      generateReportData();
    }
  }, [bookings, selectedDate, filterType]);

  const fetchAllBookings = async () => {
    setLoading(true);
    try {
      const bookingsRef = collection(db, "bookings");
      const q = query(bookingsRef);
      const querySnapshot = await getDocs(q);

      const fetchedBookings: BookingSlot[] = [];
      querySnapshot.forEach((doc) => {
        fetchedBookings.push({ id: doc.id, ...doc.data() } as BookingSlot);
      });

      setBookings(fetchedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = () => {
    let approvedCount = 0;
    let rejectedCount = 0;
    let pendingCount = 0;
    let cricketCount = 0;
    let footballCount = 0;

    const filteredBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      const selectedYear = selectedDate.getFullYear();
      const selectedMonth = selectedDate.getMonth();
      const selectedDay = selectedDate.getDate();

      if (filterType === "year") {
        return bookingDate.getFullYear() === selectedYear;
      } else if (filterType === "month") {
        return (
          bookingDate.getFullYear() === selectedYear &&
          bookingDate.getMonth() === selectedMonth
        );
      } else if (filterType === "day") {
        return (
          bookingDate.getFullYear() === selectedYear &&
          bookingDate.getMonth() === selectedMonth &&
          bookingDate.getDate() === selectedDay
        );
      }
      return false;
    });

    filteredBookings.forEach((booking) => {
      if (booking.status === "approved") {
        approvedCount++;
      } else if (booking.status === "rejected") {
        rejectedCount++;
      } else {
        pendingCount++;
      }

      if (booking.groundType?.toLowerCase() === "cricket") {
        cricketCount++;
      } else if (booking.groundType?.toLowerCase() === "football") {
        footballCount++;
      }
    });

    setReportData({
      totalCount: filteredBookings.length,
      approvedCount,
      rejectedCount,
      pendingCount,
      cricketCount,
      footballCount,
    });
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const toggleMenu = () => {
    if (!menuVisible) {
      setMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setMenuVisible(false);
      });
    }
  };

  const navigateTo = (route: any) => {
    setMenuVisible(false);
    router.push(route as never);
  };

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Booking Reports",
          headerBackVisible: false, // Remove back button
          headerLeft: () => (
            <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
              <Ionicons name="menu" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Side Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          // Close with animation
          Animated.timing(slideAnim, {
            toValue: -300,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setMenuVisible(false);
          });
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            // Close with animation
            Animated.timing(slideAnim, {
              toValue: -300,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setMenuVisible(false);
            });
          }}
        >
          <Animated.View
            style={[
              styles.sideMenu,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Admin Menu</Text>
              <TouchableOpacity
                onPress={() => {
                  // Close with animation
                  Animated.timing(slideAnim, {
                    toValue: -300,
                    duration: 300,
                    useNativeDriver: true,
                  }).start(() => {
                    setMenuVisible(false);
                  });
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("/screens/adminDashboard")}
            >
              <Ionicons name="grid-outline" size={22} color="#007AFF" />
              <Text style={styles.menuItemText}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("/screens/AdminReports")}
            >
              <Ionicons name="bar-chart-outline" size={22} color="#007AFF" />
              <Text style={styles.menuItemText}>Reports</Text>
            </TouchableOpacity>

            {/* Logout Button inside the menu */}
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutMenuItem]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color="#f44336" />
              <Text style={[styles.menuItemText, { color: "#f44336" }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={styles.container}>
        {/* Date Picker and Filter Type Selection */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === "day" && styles.activeFilter,
            ]}
            onPress={() => setFilterType("day")}
          >
            <Text
              style={[
                styles.filterText,
                filterType === "day" && styles.activeFilterText,
              ]}
            >
              Day
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === "month" && styles.activeFilter,
            ]}
            onPress={() => setFilterType("month")}
          >
            <Text
              style={[
                styles.filterText,
                filterType === "month" && styles.activeFilterText,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === "year" && styles.activeFilter,
            ]}
            onPress={() => setFilterType("year")}
          >
            <Text
              style={[
                styles.filterText,
                filterType === "year" && styles.activeFilterText,
              ]}
            >
              Year
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerButtonText}>
            {filterType === "year"
              ? selectedDate.getFullYear()
              : filterType === "month"
              ? selectedDate.toLocaleString("default", { month: "long" }) +
                " " +
                selectedDate.getFullYear()
              : selectedDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode={
              filterType === "year"
                ? "date"
                : filterType === "month"
                ? "date"
                : "date"
            }
            display="default"
            onChange={handleDateChange}
          />
        )}

        {/* Summary Stats */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={[styles.statBox, styles.totalStat]}>
              <Text style={styles.statValue}>{reportData.totalCount}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statBox, styles.approvedStat]}>
              <Text style={styles.statValue}>{reportData.approvedCount}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
            <View style={[styles.statBox, styles.rejectedStat]}>
              <Text style={styles.statValue}>{reportData.rejectedCount}</Text>
              <Text style={styles.statLabel}>Rejected</Text>
            </View>
            <View style={[styles.statBox, styles.pendingStat]}>
              <Text style={styles.statValue}>{reportData.pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statBox, styles.cricketStat]}>
              <Text style={styles.statValue}>{reportData.cricketCount}</Text>
              <Text style={styles.statLabel}>Cricket</Text>
            </View>
            <View style={[styles.statBox, styles.footballStat]}>
              <Text style={styles.statValue}>{reportData.footballCount}</Text>
              <Text style={styles.statLabel}>Football</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 5,
    alignItems: "center",
  },
  activeFilter: {
    backgroundColor: "#007AFF",
    borderColor: "#0056b3",
  },
  filterText: {
    fontWeight: "500",
    color: "#333",
  },
  activeFilterText: {
    color: "#ffffff", // White text for better contrast on blue background
    fontWeight: "600",
  },
  datePickerButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  datePickerButtonText: {
    fontWeight: "500",
    color: "#333",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statBox: {
    width: "48%",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  totalStat: {
    backgroundColor: "#e3f2fd",
    borderLeftWidth: 4,
    borderLeftColor: "#2196f3",
  },
  approvedStat: {
    backgroundColor: "#e8f5e9",
    borderLeftWidth: 4,
    borderLeftColor: "#4caf50",
  },
  rejectedStat: {
    backgroundColor: "#ffebee",
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  pendingStat: {
    backgroundColor: "#fffde7",
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  cricketStat: {
    backgroundColor: "#e0f7fa",
    borderLeftWidth: 4,
    borderLeftColor: "#00bcd4",
  },
  footballStat: {
    backgroundColor: "#f3e5f5",
    borderLeftWidth: 4,
    borderLeftColor: "#9c27b0",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  // Menu styles
  menuButton: {
    marginLeft: 16,
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sideMenu: {
    width: "70%",
    height: "100%",
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
  },
  logoutMenuItem: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    borderBottomWidth: 0,
  },
});
