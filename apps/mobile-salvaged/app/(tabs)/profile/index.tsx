import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { LogOut, Heart, Bell, Shield, HelpCircle, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useLendlee } from '@/providers/LendleeProvider';
import { getInitials } from '@/utils/categories';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { stats } = useLendlee();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const settingsItems = [
    { icon: Bell, label: 'Notifications', subtitle: 'Coming soon' },
    { icon: Shield, label: 'Privacy', subtitle: 'Coming soon' },
    { icon: HelpCircle, label: 'Help & Support', subtitle: 'Coming soon' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user ? getInitials(user.user_metadata?.name || user.email?.split('@')[0] || 'User') : '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.user_metadata?.name || user?.email?.split('@')[0] || 'Guest'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>

        <View style={styles.profileStats}>
          <View style={styles.profileStat}>
            <Text style={styles.profileStatNumber}>{stats.total}</Text>
            <Text style={styles.profileStatLabel}>Items</Text>
          </View>
          <View style={styles.profileStatDivider} />
          <View style={styles.profileStat}>
            <Text style={styles.profileStatNumber}>{stats.activeLoans}</Text>
            <Text style={styles.profileStatLabel}>Active Loans</Text>
          </View>
          <View style={styles.profileStatDivider} />
          <View style={styles.profileStat}>
            <Text style={styles.profileStatNumber}>{stats.lent}</Text>
            <Text style={styles.profileStatLabel}>Lent Out</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsCard}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.settingsRow,
                index < settingsItems.length - 1 && styles.settingsRowBorder,
              ]}
              activeOpacity={0.6}
            >
              <item.icon size={20} color={Colors.muted} />
              <View style={styles.settingsRowContent}>
                <Text style={styles.settingsLabel}>{item.label}</Text>
                <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={18} color={Colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
          testID="logout-button"
        >
          <LogOut size={20} color={Colors.destructive} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.brandSection}>
        <Heart size={18} color={Colors.accentLight} fill={Colors.accentLight} />
        <Text style={styles.brandText}>Lendlee</Text>
        <Text style={styles.brandTagline}>Lend freely. Care deeply.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.cream,
  },
  name: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.earth,
  },
  email: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  profileStats: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  profileStat: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  profileStatLabel: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.mutedForeground,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingLeft: 4,
  },
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsRowContent: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.foreground,
  },
  settingsSubtitle: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FECDD2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.destructive,
  },
  brandSection: {
    alignItems: 'center',
    marginTop: 36,
    gap: 4,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.accentLight,
  },
  brandTagline: {
    fontSize: 13,
    color: Colors.mutedForeground,
    fontStyle: 'italic' as const,
  },
});
