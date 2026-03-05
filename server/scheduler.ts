import { storage } from "./storage";
import { sendPlainEmail } from "./email";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";

const RECIPIENT_EMAIL = process.env.SMTP_USER || "";

// Run a callback every day at a given hour (Paris time)
function scheduleDaily(hour: number, minute: number, callback: () => void) {
  const check = () => {
    const now = new Date();
    // Convert to Paris time
    const paris = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
    const msUntilTarget = new Date(
      paris.getFullYear(),
      paris.getMonth(),
      paris.getDate(),
      hour,
      minute,
      0
    ).getTime() - paris.getTime();

    let delay = msUntilTarget;
    if (delay < 0) {
      // Already past today's target, schedule for tomorrow
      delay += 24 * 60 * 60 * 1000;
    }

    setTimeout(() => {
      callback();
      // Schedule next run in ~24h (re-calculate to handle DST)
      setTimeout(check, 1000);
    }, delay);
  };
  check();
}

async function sendDailyExport() {
  try {
    const today = format(new Date(), "yyyy-MM-dd");
    const completedMissions = await storage.getCompletedMissionsByDate(today);

    if (completedMissions.length === 0) {
      console.log("[scheduler] Aucune mission terminee aujourd'hui, pas d'export envoye.");
      return;
    }

    const rows = completedMissions.map((m) => {
      return `<tr>
        <td style="padding:8px;border:1px solid #ddd">${m.title}</td>
        <td style="padding:8px;border:1px solid #ddd">${m.clientName}</td>
        <td style="padding:8px;border:1px solid #ddd">${m.location || "-"}</td>
        <td style="padding:8px;border:1px solid #ddd">${m.status}</td>
      </tr>`;
    }).join("");

    const html = `
      <h2>Export journalier - ${format(new Date(), "dd MMMM yyyy", { locale: fr })}</h2>
      <p>${completedMissions.length} mission(s) terminee(s) aujourd'hui :</p>
      <table style="border-collapse:collapse;width:100%">
        <thead>
          <tr style="background:#f4f4f4">
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Mission</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Client</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Lieu</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Statut</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#888;margin-top:16px">Email automatique - Limpid'EAU</p>
    `;

    await sendPlainEmail({
      to: RECIPIENT_EMAIL,
      subject: `[Limpid'EAU] Export journalier - ${format(new Date(), "dd/MM/yyyy")}`,
      html,
    });

    console.log(`[scheduler] Export journalier envoye a ${RECIPIENT_EMAIL}`);
  } catch (error) {
    console.error("[scheduler] Erreur envoi export journalier:", error);
  }
}

async function sendMissionReminders() {
  try {
    const allMissions = await storage.getAllMissions();
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

    // Find missions starting tomorrow that are not completed/cancelled
    const upcoming = allMissions.filter((m) => {
      const missionDate = format(new Date(m.startDate), "yyyy-MM-dd");
      return missionDate === tomorrow && m.status !== "completed" && m.status !== "cancelled";
    });

    if (upcoming.length === 0) {
      console.log("[scheduler] Aucune mission prevue demain.");
      return;
    }

    const rows = upcoming.map((m) => {
      return `<tr>
        <td style="padding:8px;border:1px solid #ddd">${m.title}</td>
        <td style="padding:8px;border:1px solid #ddd">${m.clientName}</td>
        <td style="padding:8px;border:1px solid #ddd">${m.location || "-"}</td>
        <td style="padding:8px;border:1px solid #ddd">${format(new Date(m.startDate), "HH:mm")}</td>
      </tr>`;
    }).join("");

    const tomorrowFormatted = format(addDays(new Date(), 1), "dd MMMM yyyy", { locale: fr });

    const html = `
      <h2>Rappel missions - ${tomorrowFormatted}</h2>
      <p>${upcoming.length} mission(s) prevue(s) demain :</p>
      <table style="border-collapse:collapse;width:100%">
        <thead>
          <tr style="background:#f4f4f4">
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Mission</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Client</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Lieu</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Heure</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#888;margin-top:16px">Email automatique - Limpid'EAU</p>
    `;

    await sendPlainEmail({
      to: RECIPIENT_EMAIL,
      subject: `[Limpid'EAU] Rappel missions du ${format(addDays(new Date(), 1), "dd/MM/yyyy")}`,
      html,
    });

    console.log(`[scheduler] Rappel missions envoye a ${RECIPIENT_EMAIL}`);
  } catch (error) {
    console.error("[scheduler] Erreur envoi rappel missions:", error);
  }
}

export function startScheduler() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("[scheduler] SMTP_USER ou SMTP_PASS manquant, scheduler desactive.");
    return;
  }

  console.log("[scheduler] Demarrage du scheduler email...");

  // Export journalier a 18h00 (heure de Paris)
  scheduleDaily(18, 0, sendDailyExport);

  // Rappel missions a 7h00 (heure de Paris)
  scheduleDaily(7, 0, sendMissionReminders);

  console.log("[scheduler] Export journalier programme a 18h00 (Paris)");
  console.log("[scheduler] Rappel missions programme a 7h00 (Paris)");
}
