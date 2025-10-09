// lib/email.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function enviarEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Guía Atmosféricos" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email enviado:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error al enviar email:", error);
    return { success: false, error };
  }
}

// Template 1: Registro Completado (Validación en Revisión)
export function templateRegistroPendiente(
  nombreEmpresa: string,
  email: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1c2e39; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .highlight-box { background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .premium-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .contact-box { background-color: #10b981; color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; padding: 20px; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
        .whatsapp-link { color: white; font-weight: bold; font-size: 18px; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Tu registro fue recibido con éxito 🌎</h1>
        </div>
        <div class="content">
          <h2>¡Perfecto! 🎉</h2>
          <p>Ya validamos tus datos y tu empresa <strong>${nombreEmpresa}</strong> fue registrada correctamente en Guía Atmosféricos.</p>
          
          <div class="highlight-box">
            <p style="margin: 0;"><strong>📋 Estado actual:</strong> En este momento, el perfil se encuentra en <strong>revisión</strong> para asegurar que toda la información cumpla con nuestros estándares de calidad.</p>
            <p style="margin: 10px 0 0 0;">Una vez aprobado, tu empresa será visible públicamente en la plataforma.</p>
          </div>
          
          <div class="premium-box">
            <h3 style="margin-top: 0;">📣 ¡Potenciá tu visibilidad!</h3>
            <p>Además, luego podrás acceder al beneficio de <strong>destacar tu empresa</strong>, para que aparezca en los primeros resultados de búsqueda dentro de nuestra web y obtengas <strong>mayor visibilidad y posicionamiento</strong> frente a tus competidores.</p>
          </div>
          
          <div class="contact-box">
            <p style="margin: 0 0 10px 0;">Para más información o si querés conocer cómo funciona este <strong>servicio premium</strong>, podés comunicarte directamente con nosotros:</p>
            <p style="margin: 10px 0;">
              📞 <a href="https://wa.me/5491155646135" class="whatsapp-link" style="color: white;">+54 9 11 5564-6135</a><br>
              <span style="font-size: 14px;">(WhatsApp)</span>
            </p>
          </div>
          
          <p><strong>Datos registrados:</strong></p>
          <p>
            📧 Email: <strong>${email}</strong><br>
            🏢 Empresa: <strong>${nombreEmpresa}</strong>
          </p>
          
          <p style="margin-top: 30px;">Gracias por sumarte a <strong>Guía Atmosféricos</strong> — tu espacio en la red para impulsar tu negocio.</p>
          
          <p style="margin-top: 30px;">Saludos cordiales,<br>
          <strong>Equipo de Guía Atmosféricos</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Guía Atmosféricos - Todos los derechos reservados</p>
          <p>Visibilidad para quienes mueven el país 💧🚛</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Tu registro fue recibido con éxito 🌎

¡Perfecto! 🎉

Ya validamos tus datos y tu empresa ${nombreEmpresa} fue registrada correctamente en Guía Atmosféricos.

ESTADO ACTUAL: En este momento, el perfil se encuentra en revisión para asegurar que toda la información cumpla con nuestros estándares de calidad.

Una vez aprobado, tu empresa será visible públicamente en la plataforma.

📣 ¡POTENCIÁ TU VISIBILIDAD!
Además, luego podrás acceder al beneficio de destacar tu empresa, para que aparezca en los primeros resultados de búsqueda dentro de nuestra web y obtengas mayor visibilidad y posicionamiento frente a tus competidores.

CONTACTO:
Para más información o si querés conocer cómo funciona este servicio premium:
📞 +54 9 11 5564-6135 (WhatsApp)

Datos registrados:
- Email: ${email}
- Empresa: ${nombreEmpresa}

Gracias por sumarte a Guía Atmosféricos — tu espacio en la red para impulsar tu negocio.

Saludos,
Equipo de Guía Atmosféricos
  `;

  return { html, text };
}

// Template 2: Empresa Habilitada (Confirmación Final)
export function templateEmpresaHabilitada(
  nombreEmpresa: string,
  email: string,
  slug: string
) {
  const urlEmpresa = `${
    process.env.NEXT_PUBLIC_URL || "https://guia-atmosfericos.com"
  }/empresas/${slug}`;
  const urlPanel = `${
    process.env.NEXT_PUBLIC_URL || "https://guia-atmosfericos.com"
  }/panel`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-badge { background-color: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; font-weight: bold; }
        .button { display: inline-block; background-color: #1c2e39; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .premium-box { background-color: #fff9e6; border: 2px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .contact-box { background-color: #10b981; color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; padding: 20px; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
        .whatsapp-link { color: white; font-weight: bold; font-size: 18px; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">¡Tu empresa ya está visible en Guía Atmosféricos! ✅</h1>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="success-badge">✅ EMPRESA HABILITADA</span>
          </div>
          
          <h2>¡Felicitaciones! 🎉</h2>
          <p>Tu empresa <strong>${nombreEmpresa}</strong> ya fue aprobada y habilitada en la plataforma de Guía Atmosféricos.</p>
          
          <p><strong>Ahora tu perfil se encuentra visible públicamente</strong> y forma parte de nuestra red de empresas del rubro.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${urlEmpresa}" class="button">Ver mi Perfil Público</a>
            <a href="${urlPanel}" class="button">Ir al Panel de Control</a>
          </div>
          
          <div class="premium-box">
            <h3 style="margin-top: 0; color: #1c2e39;">💡 Potenciá aún más tu presencia</h3>
            <p>Si querés potenciar aún más tu presencia, podés acceder al servicio de <strong>empresas destacadas</strong>, que te permite:</p>
            <ul style="color: #333;">
              <li><strong>Aparecer primero</strong> en los resultados de búsqueda</li>
              <li>Obtener <strong>prioridad</strong> en el listado de categorías</li>
              <li><strong>Aumentar tu visibilidad</strong> y generar más consultas</li>
            </ul>
          </div>
          
          <div class="contact-box">
            <p style="margin: 0 0 10px 0;">Para conocer cómo <strong>destacar tu empresa</strong>, escribinos o comunicate:</p>
            <p style="margin: 10px 0;">
              📞 <a href="https://wa.me/5491155646135" class="whatsapp-link" style="color: white;">+54 9 11 5564-6135</a><br>
              <span style="font-size: 14px;">(WhatsApp)</span>
            </p>
          </div>
          
          <p><strong>📌 Tu perfil público:</strong><br>
          <a href="${urlEmpresa}">${urlEmpresa}</a></p>
          
          <p><strong>🔐 Acceso al panel:</strong><br>
          Email: <strong>${email}</strong><br>
          Panel de control: <a href="${urlPanel}">${urlPanel}</a></p>
          
          <p style="margin-top: 30px;">¡Gracias por confiar en Guía Atmosféricos! 🌎</p>
          <p>Seguimos trabajando para que tu negocio llegue más lejos.</p>
          
          <p style="margin-top: 30px;">Saludos cordiales,<br>
          <strong>Equipo de Guía Atmosféricos</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Guía Atmosféricos - Todos los derechos reservados</p>
          <p>Visibilidad para quienes mueven el país 💧🚛</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
¡Tu empresa ya está visible en Guía Atmosféricos! ✅

¡Felicitaciones! 🎉

Tu empresa ${nombreEmpresa} ya fue aprobada y habilitada en la plataforma de Guía Atmosféricos.

Ahora tu perfil se encuentra visible públicamente y forma parte de nuestra red de empresas del rubro.

💡 POTENCIÁ AÚN MÁS TU PRESENCIA

Si querés potenciar aún más tu presencia, podés acceder al servicio de empresas destacadas, que te permite:

• Aparecer primero en los resultados de búsqueda.
• Obtener prioridad en el listado de categorías.
• Aumentar tu visibilidad y generar más consultas.

CONTACTO:
Para conocer cómo destacar tu empresa:
📞 +54 9 11 5564-6135 (WhatsApp)

Tu perfil público: ${urlEmpresa}
Panel de control: ${urlPanel}

Acceso:
Email: ${email}

¡Gracias por confiar en Guía Atmosféricos! 🌎 
Seguimos trabajando para que tu negocio llegue más lejos.

Saludos,
Equipo de Guía Atmosféricos
  `;

  return { html, text };
}

// Template 3: Email Genérico de Marketing (Empresas Destacadas)
export function templateMarketingDestacadas(nombreEmpresa: string) {
  const urlWeb = process.env.NEXT_PUBLIC_URL || "https://guia-atmosfericos.com";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ffc107; color: #1c2e39; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .benefit-box { background-color: white; border: 2px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .cta-box { background-color: #10b981; color: white; padding: 25px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; padding: 20px; }
        ul { padding-left: 20px; }
        li { margin: 10px 0; }
        .highlight { background-color: #fff3cd; padding: 2px 8px; border-radius: 3px; font-weight: bold; }
        .whatsapp-link { color: white; font-weight: bold; font-size: 20px; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">Destacá tu empresa y multiplicá tus consultas 🚀</h1>
        </div>
        <div class="content">
          <h2>¿Querés que tu empresa aparezca primero en las búsquedas dentro de Guía Atmosféricos?</h2>
          
          <p>Hola, <strong>${nombreEmpresa}</strong>!</p>
          
          <div class="benefit-box">
            <h3 style="margin-top: 0; color: #1c2e39;">✨ Con nuestro sistema de empresas destacadas, tu negocio gana:</h3>
            <ul style="color: #333; font-size: 16px;">
              <li><strong>Más visibilidad:</strong> Aparecé primero en los resultados</li>
              <li><strong>Mejor posicionamiento:</strong> Destacá sobre tu competencia</li>
              <li><strong>Mayor cantidad de contactos:</strong> Multiplicá tus oportunidades de negocio</li>
            </ul>
            <p style="margin-bottom: 0; color: #666;">Es una <span class="highlight">inversión simple</span> que te da prioridad sobre la competencia.</p>
          </div>
          
          <div class="cta-box">
            <h3 style="margin-top: 0; color: white;">📞 Consultá ahora por el servicio de empresas destacadas</h3>
            <p style="margin: 15px 0;">
              <a href="https://wa.me/5491155646135" class="whatsapp-link" style="color: white;">+54 9 11 5564-6135</a><br>
              <span style="font-size: 16px;">(WhatsApp)</span>
            </p>
            <p style="margin: 15px 0 0 0;">
              O visitá nuestra web:<br>
              <a href="${urlWeb}" style="color: white; font-size: 16px; text-decoration: underline;">${urlWeb}</a>
            </p>
          </div>
          
          <p style="text-align: center; margin-top: 30px; font-size: 18px; color: #1c2e39;">
            <strong>Guía Atmosféricos</strong><br>
            Visibilidad para quienes mueven el país 💧🚛
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Guía Atmosféricos - Todos los derechos reservados</p>
          <p>Si no deseás recibir más información sobre este servicio, <a href="${urlWeb}/contacto">contactanos</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Destacá tu empresa y multiplicá tus consultas 🚀

¿Querés que tu empresa aparezca primero en las búsquedas dentro de Guía Atmosféricos?

Hola, ${nombreEmpresa}!

✨ CON NUESTRO SISTEMA DE EMPRESAS DESTACADAS, TU NEGOCIO GANA:

• Más visibilidad: Aparecé primero en los resultados
• Mejor posicionamiento: Destacá sobre tu competencia  
• Mayor cantidad de contactos: Multiplicá tus oportunidades de negocio

Es una inversión simple que te da prioridad sobre la competencia.

CONTACTO:
📞 Consultá por el servicio de empresas destacadas:
+54 9 11 5564-6135 (WhatsApp)

O visitá nuestra web: ${urlWeb}

Guía Atmosféricos — visibilidad para quienes mueven el país 💧🚛

---
© ${new Date().getFullYear()} Guía Atmosféricos
  `;

  return { html, text };
}

// Template: Empresa Deshabilitada
export function templateEmpresaDeshabilitada(
  nombreEmpresa: string,
  email: string
) {
  const urlContacto = `${
    process.env.NEXT_PUBLIC_URL || "https://guia-atmosfericos.com"
  }/contacto`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .contact-box { background-color: #10b981; color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .button { display: inline-block; background-color: #1c2e39; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; padding: 20px; }
        .whatsapp-link { color: white; font-weight: bold; text-decoration: none; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">⚠️ Estado de tu Empresa</h1>
        </div>
        <div class="content">
          <h2>Hola, ${nombreEmpresa}</h2>
          <p>Te informamos que tu empresa ha sido <strong>deshabilitada temporalmente</strong> en nuestra plataforma.</p>
          
          <div class="alert-box">
            <strong>⚠️ Estado actual:</strong> Empresa deshabilitada - No visible al público
          </div>
          
          <p><strong>¿Qué significa esto?</strong></p>
          <p>Tu empresa no aparecerá en los resultados de búsqueda ni será visible para los usuarios hasta que sea habilitada nuevamente.</p>
          
          <p><strong>Posibles motivos:</strong></p>
          <ul>
            <li>Actualización de información pendiente</li>
            <li>Revisión de datos o servicios</li>
            <li>Verificación de cumplimiento de requisitos</li>
          </ul>
          
          <div class="contact-box">
            <p style="margin: 0 0 10px 0;">Si creés que esto es un error o necesitás más información, contactanos:</p>
            <p style="margin: 10px 0;">
              📞 <a href="https://wa.me/5491155646135" class="whatsapp-link" style="color: white;">+54 9 11 5564-6135</a><br>
              <span style="font-size: 14px;">(WhatsApp)</span>
            </p>
            <a href="${urlContacto}" class="button" style="color: white; display: inline-block; margin-top: 10px;">Contactar Soporte</a>
          </div>
          
          <p><strong>Datos de contacto:</strong><br>
          Email: ${email}<br>
          Empresa: ${nombreEmpresa}</p>
          
          <p>Estamos a tu disposición para ayudarte a resolver cualquier inconveniente.</p>
          
          <p style="margin-top: 30px;">Saludos cordiales,<br>
          <strong>Equipo de Guía Atmosféricos</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Guía Atmosféricos - Todos los derechos reservados</p>
          <p>Visibilidad para quienes mueven el país 💧🚛</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Estado de tu Empresa

Hola, ${nombreEmpresa}

Te informamos que tu empresa ha sido deshabilitada temporalmente en nuestra plataforma.

⚠️ ESTADO ACTUAL: Empresa deshabilitada - No visible al público

Tu empresa no aparecerá en los resultados de búsqueda hasta que sea habilitada nuevamente.

POSIBLES MOTIVOS:
• Actualización de información pendiente
• Revisión de datos o servicios
• Verificación de cumplimiento de requisitos

CONTACTO:
Si creés que esto es un error o necesitás más información:
📞 +54 9 11 5564-6135 (WhatsApp)

Datos:
Email: ${email}
Empresa: ${nombreEmpresa}

Estamos a tu disposición para ayudarte.

Saludos,
Equipo de Guía Atmosféricos
  `;

  return { html, text };
}

// Template: Notificación al Admin de Nuevo Registro
export function templateNotificacionAdminRegistro(
  nombreEmpresa: string,
  email: string,
  telefono: string,
  provincia?: string,
  localidad?: string
) {
  const urlPanel = `${
    process.env.NEXT_PUBLIC_URL || "https://guia-atmosfericos.com"
  }/panel/admin/empresas`;
  const ubicacion = [localidad, provincia].filter(Boolean).join(", ");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .data-box { background-color: white; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .data-row { padding: 10px 0; border-bottom: 1px solid #eee; }
        .data-row:last-child { border-bottom: none; }
        .data-label { font-weight: bold; color: #666; display: inline-block; width: 120px; }
        .data-value { color: #333; }
        .button { display: inline-block; background-color: #1c2e39; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; padding: 20px; }
        .badge { background-color: #ff9800; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; }
        ol { padding-left: 20px; }
        li { margin: 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🔔 Nueva Empresa Registrada</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Acción requerida</p>
        </div>
        <div class="content">
          <div class="alert-box">
            <strong>⚠️ Acción requerida:</strong> Una nueva empresa se ha registrado en la plataforma y está esperando revisión para ser habilitada.
          </div>
          
          <h2>📋 Datos de la Empresa</h2>
          
          <div class="data-box">
            <div class="data-row">
              <span class="data-label">🏢 Empresa:</span>
              <span class="data-value"><strong>${nombreEmpresa}</strong></span>
              <span class="badge">PENDIENTE</span>
            </div>
            <div class="data-row">
              <span class="data-label">📧 Email:</span>
              <span class="data-value">${email}</span>
            </div>
            <div class="data-row">
              <span class="data-label">📱 Teléfono:</span>
              <span class="data-value">${telefono}</span>
            </div>
            ${
              ubicacion
                ? `
            <div class="data-row">
              <span class="data-label">📍 Ubicación:</span>
              <span class="data-value">${ubicacion}</span>
            </div>
            `
                : ""
            }
            <div class="data-row">
              <span class="data-label">📅 Fecha:</span>
              <span class="data-value">${new Date().toLocaleString("es-AR", {
                dateStyle: "full",
                timeStyle: "short",
              })}</span>
            </div>
          </div>
          
          <h3>📝 Próximos Pasos:</h3>
          <ol>
            <li>Revisá los datos de la empresa</li>
            <li>Verificá que cumple con los requisitos</li>
            <li>Habilitá la empresa desde el panel de administración</li>
            <li>La empresa recibirá automáticamente un email de confirmación</li>
          </ol>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${urlPanel}" class="button">Ir al Panel de Administración</a>
          </div>
          
          <div class="alert-box">
            <strong>💡 Recordatorio:</strong> Mientras la empresa no sea habilitada, no aparecerá en la guía pública. El usuario ya recibió un email informándole que su solicitud está en revisión.
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Este es un email automático del sistema de gestión de Guía Atmosféricos.
          </p>
        </div>
        <div class="footer">
          <p>Panel de Administración - Guía Atmosféricos</p>
          <p>© ${new Date().getFullYear()} Guía Atmosféricos</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🔔 Nueva Empresa Registrada - ACCIÓN REQUERIDA

Una nueva empresa se ha registrado y está esperando revisión.

DATOS DE LA EMPRESA:
━━━━━━━━━━━━━━━━━━━━━
🏢 Empresa: ${nombreEmpresa}
📧 Email: ${email}
📱 Teléfono: ${telefono}
${ubicacion ? `📍 Ubicación: ${ubicacion}` : ""}
📅 Fecha: ${new Date().toLocaleString("es-AR")}
━━━━━━━━━━━━━━━━━━━━━

ESTADO: PENDIENTE DE REVISIÓN

PRÓXIMOS PASOS:
1. Revisar los datos de la empresa
2. Verificar que cumple con los requisitos
3. Habilitar la empresa desde el panel de administración
4. La empresa recibirá automáticamente un email de confirmación

Acceder al panel: ${urlPanel}

RECORDATORIO: Mientras la empresa no sea habilitada, no aparecerá en la guía pública.

---
Sistema de gestión de Guía Atmosféricos
  `;

  return { html, text };
}
