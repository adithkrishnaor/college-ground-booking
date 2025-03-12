import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { router, Stack } from "expo-router";
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

export default function adminDashboard() {
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");
  const [loading, setLoading] = useState(true);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [activeFilter, isDateFilterActive, startDate, endDate]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const bookingsRef = collection(db, "bookings");
      let q;

      if (activeFilter === "all") {
        q = query(bookingsRef);
      } else {
        q = query(bookingsRef, where("status", "==", activeFilter));
      }

      const querySnapshot = await getDocs(q);

      let bookings: BookingSlot[] = [];
      querySnapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() } as BookingSlot);
      });

      // Apply date filter if active
      if (isDateFilterActive) {
        const startTimestamp = startDate.setHours(0, 0, 0, 0);
        const endTimestamp = endDate.setHours(23, 59, 59, 999);

        bookings = bookings.filter((booking) => {
          const bookingDate = new Date(booking.date).getTime();
          return bookingDate >= startTimestamp && bookingDate <= endTimestamp;
        });
      }

      setBookings(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      Alert.alert("Error", "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (
    bookingId: string,
    action: "approve" | "reject"
  ) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: action === "approve" ? "approved" : "rejected",
      });

      // Show success message
      Alert.alert(
        "Success",
        `Booking ${action === "approve" ? "approved" : "rejected"} successfully`
      );

      // Refresh the bookings list
      fetchBookings();
    } catch (error) {
      console.error("Error updating booking:", error);
      Alert.alert("Error", "Failed to update booking status");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "approved":
        return styles.statusApproved;
      case "rejected":
        return styles.statusRejected;
      default:
        return styles.statusPending;
    }
  };

  const handleLogout = () => {
    // Add your logout logic here (e.g., clearing auth state)
    router.push("/login");
  };

  const navigateToReports = () => {
    router.push("/screens/AdminReports");
  };

  // Function to handle phone call
  const handlePhoneCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const toggleDateFilter = () => {
    setShowDateFilter(!showDateFilter);
    if (!showDateFilter) {
      // Reset date filter when opening
      setIsDateFilterActive(false);
    }
  };

  const applyDateFilter = () => {
    if (startDate > endDate) {
      Alert.alert("Invalid Date Range", "Start date cannot be after end date");
      return;
    }
    setIsDateFilterActive(true);
    setShowDateFilter(false);
  };

  const clearDateFilter = () => {
    setIsDateFilterActive(false);
    setStartDate(new Date());
    setEndDate(new Date());
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Admin Dashboard",
          headerBackTitle: "Back",
          headerTransparent: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {/* Reports Navigation Button */}
        <TouchableOpacity
          style={styles.reportsButton}
          onPress={navigateToReports}
        >
          <Text style={styles.reportsButtonText}>View Reports</Text>
        </TouchableOpacity>

        {/* Status Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "all" && styles.activeFilter,
            ]}
            onPress={() => setActiveFilter("all")}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === "all" && styles.activeFilterText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "pending" && styles.activeFilter,
            ]}
            onPress={() => setActiveFilter("pending")}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === "pending" && styles.activeFilterText,
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "approved" && styles.activeFilter,
            ]}
            onPress={() => setActiveFilter("approved")}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === "approved" && styles.activeFilterText,
              ]}
            >
              Approved
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "rejected" && styles.activeFilter,
            ]}
            onPress={() => setActiveFilter("rejected")}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === "rejected" && styles.activeFilterText,
              ]}
            >
              Rejected
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Filter Button */}
        <View style={styles.dateFilterButtonContainer}>
          <TouchableOpacity
            style={[
              styles.dateFilterButton,
              isDateFilterActive && styles.activeDateFilter,
            ]}
            onPress={toggleDateFilter}
          >
            <Text
              style={[
                styles.dateFilterText,
                isDateFilterActive && styles.activeDateFilterText,
              ]}
            >
              {isDateFilterActive
                ? `${formatDate(startDate.toISOString())} - ${formatDate(
                    endDate.toISOString()
                  )}`
                : "Date Filter"}
            </Text>
          </TouchableOpacity>
          {isDateFilterActive && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={clearDateFilter}
            >
              <Text style={styles.clearFilterText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date Filter Selection UI */}
        {showDateFilter && (
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerLabel}>Select Date Range:</Text>

            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Start:</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartPicker(true)}
              >
                <Text>{formatDate(startDate.toISOString())}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>End:</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndPicker(true)}
              >
                <Text>{formatDate(endDate.toISOString())}</Text>
              </TouchableOpacity>
            </View>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={onStartDateChange}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={onEndDateChange}
              />
            )}

            <View style={styles.dateFilterActions}>
              <TouchableOpacity
                style={styles.cancelDateButton}
                onPress={() => setShowDateFilter(false)}
              >
                <Text style={styles.cancelDateText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyDateButton}
                onPress={applyDateFilter}
              >
                <Text style={styles.applyDateText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.title}>
          {activeFilter === "all"
            ? "All Bookings"
            : activeFilter === "pending"
            ? "Pending Bookings"
            : activeFilter === "approved"
            ? "Approved Bookings"
            : "Rejected Bookings"}
          {isDateFilterActive
            ? ` (${formatDate(startDate.toISOString())} - ${formatDate(
                endDate.toISOString()
              )})`
            : ""}
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No {activeFilter} bookings found
              {isDateFilterActive ? " in selected date range" : ""}
            </Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.bookingItem, getStatusStyle(item.status)]}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingName}>{item.name}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {item.status ? item.status.toUpperCase() : "UNKNOWN"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bookingText}>Email: {item.email}</Text>
                <View style={styles.phoneContainer}>
                  <Text style={styles.bookingText}>Phone: </Text>
                  <TouchableOpacity onPress={() => handlePhoneCall(item.phone)}>
                    <Text style={styles.phoneText}>{item.phone}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.bookingText}>
                  Date: {formatDate(item.date)}
                </Text>
                <Text style={styles.bookingText}>Time: {item.timeSlot}</Text>
                <Text style={styles.bookingText}>
                  Ground: {item.groundType}
                </Text>

                {item.status === "pending" && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleBookingAction(item.id, "approve")}
                    >
                      <Text style={styles.buttonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleBookingAction(item.id, "reject")}
                    >
                      <Text style={styles.buttonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          />
        )}
      </View>
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  activeFilter: {
    backgroundColor: "#007AFF",
  },
  filterText: {
    fontWeight: "500",
    color: "#333",
  },
  activeFilterText: {
    color: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  bookingItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  bookingName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#333",
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  statusPending: {
    backgroundColor: "#fffdeb",
    borderLeftColor: "#ffc107",
  },
  statusApproved: {
    backgroundColor: "#f0fff0",
    borderLeftColor: "#4caf50",
  },
  statusRejected: {
    backgroundColor: "#fff0f0",
    borderLeftColor: "#f44336",
  },
  bookingText: {
    fontSize: 16,
    marginBottom: 4,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 16,
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#888",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    width: 120,
    alignItems: "center",
  },
  approveButton: {
    backgroundColor: "#4caf50",
  },
  rejectButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    marginRight: 16,
    padding: 8,
  },
  logoutText: {
    color: "#f44336",
    fontWeight: "bold",
  },
  reportsButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  reportsButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
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
  dateFilterButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dateFilterButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 10,
    flexGrow: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  activeDateFilter: {
    backgroundColor: "#e6f2ff",
    borderColor: "#007AFF",
  },
  dateFilterText: {
    fontWeight: "500",
    color: "#333",
  },
  activeDateFilterText: {
    color: "#007AFF",
  },
  clearFilterButton: {
    marginLeft: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  clearFilterText: {
    color: "#666",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 2,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dateLabel: {
    width: 50,
    fontSize: 16,
  },
  dateInput: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    backgroundColor: "#f9f9f9",
  },
  dateFilterActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  cancelDateButton: {
    padding: 8,
    marginRight: 12,
  },
  cancelDateText: {
    color: "#666",
  },
  applyDateButton: {
    backgroundColor: "#007AFF",
    borderRadius: 4,
    padding: 8,
    paddingHorizontal: 16,
  },
  applyDateText: {
    color: "#fff",
    fontWeight: "500",
  },
});
