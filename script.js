const SUPABASE_URL = "https://mgxqxwvwduomvykgllwl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_eoxg6aDpuvrVDfCws3euag_LwPZ1maX";

const form = document.getElementById("registroForm");
const submitButton = document.getElementById("submitButton");
const formMessage = document.getElementById("formMessage");

const supabaseClient =
  SUPABASE_URL !== "AQUI_VA_MI_SUPABASE_URL" &&
  SUPABASE_ANON_KEY !== "AQUI_VA_MI_SUPABASE_ANON_KEY"
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

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

    form.reset();
    showMessage("Registro guardado correctamente.", "success");
  } catch (error) {
    console.error("Error al guardar el registro:", error);
    showMessage("Error al guardar el registro.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Registrar estudiante";
  }
}

form.addEventListener("submit", handleSubmit);
