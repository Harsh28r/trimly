import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerSchema, type Role } from "@trimly/contracts";
import { router } from "expo-router";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { api, getErrorMessage } from "../src/api";
import { Button, Field, Screen } from "../src/components";
import { useAuth } from "../src/store";
import { colors, radius } from "../src/theme";
import { useState } from "react";

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
        <View style={styles.mark}><Text style={styles.markText}>T</Text></View>
        <Text style={styles.brand}>trimly</Text>
        <Text style={styles.title}>{mode === "login" ? "Good hair day?" : "Let’s get you booked."}</Text>
        <Text style={styles.copy}>Discover great stylists and reserve a time without the phone calls.</Text>
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
                  <Text style={styles.roleText}>{value === "customer" ? "Customer" : "Salon owner"}</Text>
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
        <Button title={mode === "login" ? "Sign in" : "Create account"} onPress={submit} loading={isSubmitting} />
        <Pressable onPress={() => setMode(mode === "login" ? "register" : "login")}>
          <Text style={styles.switch}>
            {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 42, paddingBottom: 32, gap: 10 },
  mark: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { color: colors.ink, fontWeight: "900", fontSize: 26 },
  brand: { color: colors.ink, fontWeight: "900", fontSize: 18, letterSpacing: 1 },
  title: { color: colors.ink, fontWeight: "900", fontSize: 38, lineHeight: 42, marginTop: 10 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 24, maxWidth: 330 },
  form: { gap: 17 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700", marginBottom: -8 },
  roles: { flexDirection: "row", gap: 10 },
  role: {
    flex: 1,
    padding: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  roleActive: { backgroundColor: colors.yellowSoft, borderColor: colors.yellow },
  roleText: { color: colors.ink, fontWeight: "700" },
  switch: { textAlign: "center", color: colors.ink, fontWeight: "700", padding: 8 },
});
