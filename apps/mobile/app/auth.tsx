import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerSchema, type Role } from "@trimly/contracts";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { api, getErrorMessage } from "../src/api";
import { Button, Field, Screen } from "../src/components";
import { useAuth } from "../src/store";
import { colors, radius, shadow, textDisplay, type } from "../src/theme";

type FormValues = z.infer<typeof registerSchema>;

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const signIn = useAuth((state) => state.signIn);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(mode === "login" ? loginSchema : registerSchema) as unknown as Resolver<FormValues>,
    defaultValues: { name: "", email: "", password: "", role: "customer" },
  });
  const role = watch("role");

  const submit = handleSubmit(async (values) => {
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const { data } = await api.post(endpoint, values);
      await signIn(data);
      router.replace(data.user.role === "customer" ? "/(customer)" : "/(pro)");
    } catch (error) {
      Alert.alert("Could not continue", getErrorMessage(error));
    }
  });

  return (
    <Screen>
      <View style={styles.hero}>
        <LinearGradient
          colors={["#0A0A14", colors.ink, "#151525"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroGlow} />
        <Text style={styles.brand}>TRIMLY</Text>
        <Text style={styles.title}>{mode === "login" ? "Good hair day?" : "Let’s get you booked."}</Text>
        <Text style={styles.copy}>Discover sharp stylists. Reserve real slots. Skip the phone tag.</Text>
      </View>

      <View style={styles.sheet}>
        <View style={styles.modeRow}>
          {(["login", "register"] as const).map((value) => (
            <Pressable key={value} onPress={() => setMode(value)} style={[styles.mode, mode === value && styles.modeActive]}>
              <Text style={[styles.modeText, mode === value && styles.modeTextActive]}>
                {value === "login" ? "Sign in" : "Join"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.form}>
          {mode === "register" && (
            <>
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <Field label="Name" value={field.value} onChangeText={field.onChange} error={errors.name?.message} />
                )}
              />
              <Text style={styles.label}>I’m joining as</Text>
              <View style={styles.roles}>
                {(["customer", "owner"] as Role[]).map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setValue("role", value)}
                    style={[styles.role, role === value && styles.roleActive]}
                  >
                    <Text style={[styles.roleText, role === value && styles.roleTextActive]}>
                      {value === "customer" ? "Customer" : "Salon owner"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Field
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Field
                label="Password"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                error={errors.password?.message}
              />
            )}
          />
          <Button title={mode === "login" ? "Continue" : "Create account"} onPress={submit} loading={isSubmitting} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: -20,
    marginTop: -8,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 12,
    overflow: "hidden",
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  heroGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.yellow,
    opacity: 0.3,
    top: -40,
    right: -50,
  },
  brand: { ...type.brand, color: colors.yellowHot, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  title: { ...textDisplay({ fontSize: 36, lineHeight: 40, color: "#fff", letterSpacing: -0.8 }), textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  copy: { color: "rgba(255,255,255,0.9)", fontSize: 14, lineHeight: 20, maxWidth: 280, fontWeight: "500", textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  sheet: { marginTop: 24, gap: 20 },
  modeRow: {
    flexDirection: "row",
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  mode: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: "center" },
  modeActive: { backgroundColor: colors.ink, ...shadow.soft },
  modeText: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  modeTextActive: { color: colors.yellowHot },
  form: { gap: 14 },
  label: { ...type.label, color: colors.inkSoft, marginBottom: -4 },
  roles: { flexDirection: "row", gap: 10 },
  role: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  roleActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  roleText: { color: colors.ink, fontWeight: "700", fontSize: 12 },
  roleTextActive: { color: colors.yellowHot },
});
