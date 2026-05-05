const SUPABASE_URL = "https://mgxqxwvwduomvykgllwl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_eoxg6aDpuvrVDfCws3euag_LwPZ1maX";

const form = document.getElementById("registroForm");
const submitButton = document.getElementById("submitButton");
const formMessage = document.getElementById("formMessage");
const totalCount = document.getElementById("totalCount");
const softwareCount = document.getElementById("softwareCount");
const redesCount = document.getElementById("redesCount");
const statsMainCard = document.querySelector(".stats-main-card");
const statsCareerCards = document.querySelectorAll(".career-card");
const cedulaInput = document.getElementById("cedula");
const telefonoInput = document.getElementById("telefono");
const seccionInput = document.getElementById("seccion");
const sectionButtons = document.querySelectorAll(".toggle-option");

const supabaseClient =
  SUPABASE_URL !== "AQUI_VA_MI_SUPABASE_URL" &&
  SUPABASE_ANON_KEY !== "AQUI_VA_MI_SUPABASE_ANON_KEY"
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const statsState = {
  total: 0,
  software: 0,
  redes: 0,
};

function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

function clearMessage() {
  formMessage.textContent = "";
  formMessage.className = "form-message";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeNumber(value) {
  return value.replace(/\D/g, "");
}

function parseCountValue(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function renderStats() {
  if (totalCount) totalCount.textContent = String(statsState.total);
  if (softwareCount) softwareCount.textContent = String(statsState.software);
  if (redesCount) redesCount.textContent = String(statsState.redes);
}

function pulseStats() {
  if (statsMainCard) {
    statsMainCard.classList.add("pulse");
    setTimeout(() => statsMainCard.classList.remove("pulse"), 700);
  }

  statsCareerCards.forEach((card) => {
    card.classList.add("pulse");
    setTimeout(() => card.classList.remove("pulse"), 700);
  });
}

function syncLocalStatsFromDom() {
  statsState.total = parseCountValue(totalCount?.textContent ?? "0");
  statsState.software = parseCountValue(softwareCount?.textContent ?? "0");
  statsState.redes = parseCountValue(redesCount?.textContent ?? "0");
}

function mergeRemoteStats(remoteStats) {
  statsState.total = Math.max(statsState.total, remoteStats.total);
  statsState.software = Math.max(statsState.software, remoteStats.software);
  statsState.redes = Math.max(statsState.redes, remoteStats.redes);
  renderStats();
}

function incrementLocalStats(carrera) {
  syncLocalStatsFromDom();

  statsState.total += 1;

  if (carrera === "Desarrollo de Software") {
    statsState.software += 1;
  }

  if (carrera === "Redes y Telecomunicaciones") {
    statsState.redes += 1;
  }

  renderStats();
  pulseStats();
}

function setSection(value) {
  seccionInput.value = value;

  sectionButtons.forEach((button) => {
    const isActive = button.dataset.section === value;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function resetSection() {
  setSection("");
}

function validateForm(data) {
  const requiredFields = [
    data.nombres,
    data.apellidos,
    data.cedula,
    data.correo,
    data.carrera,
    data.seccion,
    data.telefono,
  ];

  if (requiredFields.some((field) => !field)) {
    return "Completa todos los campos obligatorios.";
  }

  if (!/^\d{10}$/.test(data.cedula)) {
    return "La cédula debe tener 10 dígitos.";
  }

  if (!/^\d{7,10}$/.test(data.telefono)) {
    return "El teléfono debe tener entre 7 y 10 dígitos.";
  }

  if (!isValidEmail(data.correo)) {
    return "Ingresa un correo válido.";
  }

  return null;
}

async function fetchRegistrationCount() {
  if (!supabaseClient || !totalCount || !softwareCount || !redesCount) {
    return;
  }

  try {
    const [
      totalResponse,
      softwareResponse,
      redesResponse,
    ] = await Promise.all([
      supabaseClient
        .from("registros_vinculacion_caces")
        .select("*", { count: "exact", head: true }),
      supabaseClient
        .from("registros_vinculacion_caces")
        .select("*", { count: "exact", head: true })
        .eq("carrera", "Desarrollo de Software"),
      supabaseClient
        .from("registros_vinculacion_caces")
        .select("*", { count: "exact", head: true })
        .eq("carrera", "Redes y Telecomunicaciones"),
    ]);

    if (totalResponse.error) throw totalResponse.error;
    if (softwareResponse.error) throw softwareResponse.error;
    if (redesResponse.error) throw redesResponse.error;

    mergeRemoteStats({
      total: totalResponse.count ?? 0,
      software: softwareResponse.count ?? 0,
      redes: redesResponse.count ?? 0,
    });

    pulseStats();
  } catch (error) {
    renderStats();
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  clearMessage();

  const formData = new FormData(form);
  const payload = {
    nombres: formData.get("nombres").trim(),
    apellidos: formData.get("apellidos").trim(),
    cedula: sanitizeNumber(formData.get("cedula")),
    correo: formData.get("correo").trim(),
    carrera: formData.get("carrera").trim(),
    seccion: formData.get("seccion").trim(),
    telefono: sanitizeNumber(formData.get("telefono")),
    observacion: formData.get("observacion").trim(),
  };

  const validationError = validateForm(payload);
  if (validationError) {
    showMessage(validationError, "error");
    return;
  }

  if (!supabaseClient) {
    showMessage("Configura SUPABASE_URL y SUPABASE_ANON_KEY para guardar el registro.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Registrando...";

  try {
    const { error } = await supabaseClient
      .from("registros_vinculacion_caces")
      .insert([
        {
          nombres: payload.nombres,
          apellidos: payload.apellidos,
          cedula: payload.cedula,
          correo: payload.correo,
          carrera: payload.carrera,
          seccion: payload.seccion,
          telefono: payload.telefono,
          observacion: payload.observacion || null,
        },
      ]);

    if (error) {
      throw error;
    }

    incrementLocalStats(payload.carrera);
    form.reset();
    resetSection();
    showMessage("Registro guardado correctamente.", "success");
    fetchRegistrationCount();
  } catch (error) {
    console.error("Error al guardar el registro:", error);
    showMessage("Error al guardar el registro.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Registrar estudiante";
  }
}

sectionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setSection(button.dataset.section || "");
  });
});

[cedulaInput, telefonoInput].forEach((input) => {
  input.addEventListener("input", (event) => {
    event.target.value = sanitizeNumber(event.target.value);
  });
});

form.addEventListener("submit", handleSubmit);
fetchRegistrationCount();
setInterval(fetchRegistrationCount, 15000);
