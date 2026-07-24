import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { api, getErrorMessage } from "../../src/api";
import { Button, Field, Screen } from "../../src/components";
import { colors, radius } from "../../src/theme";

type Salon = { _id: string; name: string; address: string; city: string };
type Detail = { services: Array<{ _id: string; name: string; price: number }>; staff: Array<{ _id: string; name: string; title: string }> };

export default function ManageStore() {
  const queryClient = useQueryClient();
  const salons = useQuery({ queryKey: ["owner-salons"], queryFn: async () => (await api.get<Salon[]>("/owner/salons")).data });
  const salon = salons.data?.[0];
  const detail = useQuery({
    queryKey: ["salon", salon?._id],
    enabled: !!salon,
    queryFn: async () => (await api.get<Detail>(`/salons/${salon!._id}`)).data,
  });
  const [store, setStore] = useState({ name: "", address: "", city: "", phone: "", description: "" });
  const [service, setService] = useState({ name: "", price: "", durationMinutes: "45" });
  const [staff, setStaff] = useState({ name: "", title: "Stylist" });

  const createStore = useMutation({
    mutationFn: async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      const location = permission.status === "granted" ? await Location.getCurrentPositionAsync({}) : null;
      return api.post("/salons", {
        ...store,
        latitude: location?.coords.latitude ?? 12.9716,
        longitude: location?.coords.longitude ?? 77.5946,
        timezone: "Asia/Kolkata",
        images: [],
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-salons"] }),
    onError: (error) => Alert.alert("Could not create store", getErrorMessage(error)),
  });
  const addService = useMutation({
    mutationFn: () => api.post(`/salons/${salon!._id}/services`, {
      name: service.name,
      description: "",
      price: Number(service.price),
      durationMinutes: Number(service.durationMinutes),
      bufferMinutes: 0,
    }),
    onSuccess: () => { setService({ name: "", price: "", durationMinutes: "45" }); queryClient.invalidateQueries({ queryKey: ["salon", salon?._id] }); },
    onError: (error) => Alert.alert("Could not add service", getErrorMessage(error)),
  });
  const addStaff = useMutation({
    mutationFn: () => api.post(`/salons/${salon!._id}/staff`, {
      ...staff,
      services: detail.data?.services.map((value) => value._id) ?? [],
      workingHours: Array.from({ length: 7 }, (_, day) => ({ day, open: "09:00", close: "18:00", enabled: day !== 0 })),
    }),
    onSuccess: () => { setStaff({ name: "", title: "Stylist" }); queryClient.invalidateQueries({ queryKey: ["salon", salon?._id] }); },
    onError: (error) => Alert.alert("Could not add staff", getErrorMessage(error)),
  });

  if (!salon && !salons.isLoading) {
    return (
      <Screen>
        <Text style={styles.title}>Create your store</Text>
        <Text style={styles.copy}>Add the basics now. You can polish everything later.</Text>
        <View style={styles.form}>
          <Field label="Salon name" value={store.name} onChangeText={(name) => setStore({ ...store, name })} />
          <Field label="Description" value={store.description} onChangeText={(description) => setStore({ ...store, description })} />
          <Field label="Address" value={store.address} onChangeText={(address) => setStore({ ...store, address })} />
          <Field label="City" value={store.city} onChangeText={(city) => setStore({ ...store, city })} />
          <Field label="Phone" keyboardType="phone-pad" value={store.phone} onChangeText={(phone) => setStore({ ...store, phone })} />
          <Button title="Create store" loading={createStore.isPending} onPress={() => createStore.mutate()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>My store</Text>
      <View style={styles.storeCard}><Text style={styles.storeName}>{salon?.name}</Text><Text style={styles.copy}>{salon?.address}, {salon?.city}</Text></View>
      <Text style={styles.section}>Services</Text>
      {detail.data?.services.map((item) => <View key={item._id} style={styles.listRow}><Text style={styles.listTitle}>{item.name}</Text><Text style={styles.listMeta}>₹{item.price}</Text></View>)}
      <View style={styles.formCard}>
        <Field label="Service name" value={service.name} onChangeText={(name) => setService({ ...service, name })} />
        <View style={styles.split}>
          <View style={{ flex: 1 }}><Field label="Price ₹" keyboardType="numeric" value={service.price} onChangeText={(price) => setService({ ...service, price })} /></View>
          <View style={{ flex: 1 }}><Field label="Minutes" keyboardType="numeric" value={service.durationMinutes} onChangeText={(durationMinutes) => setService({ ...service, durationMinutes })} /></View>
        </View>
        <Button title="Add service" variant="secondary" loading={addService.isPending} onPress={() => addService.mutate()} />
      </View>
      <Text style={styles.section}>Team</Text>
      {detail.data?.staff.map((item) => <View key={item._id} style={styles.listRow}><Text style={styles.listTitle}>{item.name}</Text><Text style={styles.listMeta}>{item.title}</Text></View>)}
      <View style={styles.formCard}>
        <Field label="Team member" value={staff.name} onChangeText={(name) => setStaff({ ...staff, name })} />
        <Field label="Title" value={staff.title} onChangeText={(title) => setStaff({ ...staff, title })} />
        <Button title="Add team member" variant="secondary" loading={addStaff.isPending} disabled={!detail.data?.services.length} onPress={() => addStaff.mutate()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 31, color: colors.ink, fontWeight: "900", paddingTop: 18 },
  copy: { color: colors.muted, marginTop: 5 },
  form: { gap: 16, marginTop: 28 },
  storeCard: { backgroundColor: colors.yellowSoft, borderRadius: radius.md, padding: 20, marginTop: 22 },
  storeName: { color: colors.ink, fontSize: 21, fontWeight: "900" },
  section: { color: colors.ink, fontSize: 20, fontWeight: "900", marginTop: 28, marginBottom: 12 },
  listRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 13, borderBottomWidth: 1, borderColor: colors.line },
  listTitle: { color: colors.ink, fontWeight: "800" },
  listMeta: { color: colors.muted },
  formCard: { gap: 13, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 16, marginTop: 15 },
  split: { flexDirection: "row", gap: 10 },
});
