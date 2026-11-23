import { hashPassword } from "better-auth/crypto";

import type {
  Category,
  Priority,
  ReplyType,
  TicketStatus,
} from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { avatarColor } from "../lib/utils";

const DEMO_PASSWORD = "tasu-demo";
const DAY = 24 * 60 * 60 * 1000;

function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(46);
const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];
const between = (min: number, max: number) =>
  min + Math.floor(random() * (max - min + 1));

const SLA: Record<Priority, { first: number; resolve: number }> = {
  URGENT: { first: 1, resolve: 8 },
  HIGH: { first: 4, resolve: 24 },
  MEDIUM: { first: 8, resolve: 48 },
  LOW: { first: 24, resolve: 72 },
  NONE: { first: 48, resolve: 96 },
};

type SeedUser = {
  name: string;
  email: string;
  role: "employee" | "agent" | "admin";
  department: string;
  title: string;
};

const SEED_USERS: SeedUser[] = [
  {
    name: "Parth Shah",
    email: "parth@tasu.app",
    role: "employee",
    department: "Engineering",
    title: "Product Engineer",
  },
  {
    name: "Maya Chen",
    email: "maya@tasu.app",
    role: "employee",
    department: "Design",
    title: "Product Designer",
  },
  {
    name: "Jonah Reed",
    email: "jonah@tasu.app",
    role: "employee",
    department: "Finance",
    title: "Financial Analyst",
  },
  {
    name: "Priya Nair",
    email: "priya@tasu.app",
    role: "agent",
    department: "IT",
    title: "IT Support Lead",
  },
  {
    name: "Arjun Mehta",
    email: "arjun@tasu.app",
    role: "agent",
    department: "IT",
    title: "Desktop Engineer",
  },
  {
    name: "Sam Okafor",
    email: "admin@tasu.app",
    role: "admin",
    department: "IT",
    title: "IT Manager",
  },
];

type TicketSeed = {
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  category: Category;
  tags: string[];
  requester: string;
  assignee: string | null;
  ageDays: number;
};

const TICKET_SEEDS: TicketSeed[] = [
  {
    title: "VPN disconnects every 10 minutes",
    description:
      "Since the update yesterday, my VPN drops every 10 minutes or so. I can reconnect immediately, but it kills long-running uploads.\n\nI'm on macOS 15.2 and using the corporate profile.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    category: "NETWORK",
    tags: ["vpn", "network", "macos"],
    requester: "parth@tasu.app",
    assignee: "arjun@tasu.app",
    ageDays: 1,
  },
  {
    title: "Adobe license expired",
    description:
      "Photoshop and Illustrator both say my license has expired. I have a shoot to deliver on Friday so this is blocking.",
    status: "WAITING_ON_USER",
    priority: "URGENT",
    category: "SOFTWARE",
    tags: ["adobe", "license"],
    requester: "maya@tasu.app",
    assignee: "priya@tasu.app",
    ageDays: 2,
  },
  {
    title: "Cannot access staging database",
    description:
      "I can't connect to the staging Postgres instance. My IP may not be on the allowlist — I'm working from home today.",
    status: "OPEN",
    priority: "HIGH",
    category: "ACCESS",
    tags: ["database", "staging", "access"],
    requester: "parth@tasu.app",
    assignee: null,
    ageDays: 0,
  },
  {
    title: "Printer on the 4th floor is offline",
    description:
      "The Canon printer by the kitchen shows offline for everyone. Power cycling did not help.",
    status: "OPEN",
    priority: "MEDIUM",
    category: "HARDWARE",
    tags: ["printer", "office"],
    requester: "jonah@tasu.app",
    assignee: null,
    ageDays: 1,
  },
  {
    title: "New hire laptop setup",
    description:
      "Nina starts Monday. Needs a MacBook Air configured with the design stack, and accounts for Figma, Linear, and Slack.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    category: "HARDWARE",
    tags: ["onboarding", "laptop"],
    requester: "maya@tasu.app",
    assignee: "arjun@tasu.app",
    ageDays: 3,
  },
  {
    title: "Slack notifications not arriving on iPhone",
    description:
      "Notifications work on desktop but never arrive on my phone. Focus mode is off and the app has permission.",
    status: "RESOLVED",
    priority: "LOW",
    category: "SOFTWARE",
    tags: ["slack", "mobile"],
    requester: "parth@tasu.app",
    assignee: "priya@tasu.app",
    ageDays: 6,
  },
  {
    title: "Wi-Fi keeps dropping in meeting room 3",
    description:
      "Every call in room 3 freezes after about five minutes. Two other people said the same thing this week.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    category: "NETWORK",
    tags: ["wifi", "meeting-room"],
    requester: "jonah@tasu.app",
    assignee: "priya@tasu.app",
    ageDays: 4,
  },
  {
    title: "Figma file won't open",
    description:
      "The Q4 campaign file hangs on 'loading'. Other files open fine. It's shared with the whole design team.",
    status: "WAITING_ON_USER",
    priority: "MEDIUM",
    category: "SOFTWARE",
    tags: ["figma", "design"],
    requester: "maya@tasu.app",
    assignee: "arjun@tasu.app",
    ageDays: 5,
  },
  {
    title: "Request access to analytics dashboard",
    description:
      "Need read access to the product analytics dashboard for the retention project. Manager approval attached in the thread.",
    status: "OPEN",
    priority: "LOW",
    category: "ACCESS",
    tags: ["analytics", "access"],
    requester: "parth@tasu.app",
    assignee: null,
    ageDays: 2,
  },
  {
    title: "External monitor flickering",
    description:
      "The monitor flickers every few seconds when connected over USB-C. Tried a different cable and it still happens.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    category: "HARDWARE",
    tags: ["monitor", "usb-c"],
    requester: "maya@tasu.app",
    assignee: "arjun@tasu.app",
    ageDays: 8,
  },
  {
    title: "Password reset loop",
    description:
      "I reset my password, sign in, and it immediately asks me to reset it again. Locked out for the third time.",
    status: "RESOLVED",
    priority: "URGENT",
    category: "ACCESS",
    tags: ["password", "sso"],
    requester: "jonah@tasu.app",
    assignee: "priya@tasu.app",
    ageDays: 9,
  },
  {
    title: "Zoom audio echoes in huddle rooms",
    description:
      "Everyone hears themselves in the two huddle rooms. The ceiling mic may be picking up the speakers.",
    status: "OPEN",
    priority: "MEDIUM",
    category: "HARDWARE",
    tags: ["zoom", "audio"],
    requester: "parth@tasu.app",
    assignee: null,
    ageDays: 3,
  },
  {
    title: "GitHub SSO failing",
    description:
      "GitHub says 'organization requires SAML' and loops back to Okta without signing me in.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    category: "ACCESS",
    tags: ["github", "sso", "okta"],
    requester: "parth@tasu.app",
    assignee: "priya@tasu.app",
    ageDays: 1,
  },
  {
    title: "Laptop battery drains in an hour",
    description:
      "Battery health says service recommended. I'm mostly in meetings today so a charger isn't always possible.",
    status: "OPEN",
    priority: "MEDIUM",
    category: "HARDWARE",
    tags: ["battery", "laptop"],
    requester: "maya@tasu.app",
    assignee: null,
    ageDays: 2,
  },
  {
    title: "Need Photoshop for the campaign",
    description:
      "Requesting a Photoshop license for the next two months for social campaign assets.",
    status: "WAITING_ON_USER",
    priority: "LOW",
    category: "SOFTWARE",
    tags: ["adobe", "license"],
    requester: "maya@tasu.app",
    assignee: "arjun@tasu.app",
    ageDays: 7,
  },
  {
    title: "Shared drive permissions",
    description:
      "I can't write to the Finance/Planning folder. I could last week, so something changed.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    category: "ACCESS",
    tags: ["sharepoint", "permissions"],
    requester: "jonah@tasu.app",
    assignee: "priya@tasu.app",
    ageDays: 5,
  },
  {
    title: "Okta Verify not sending push",
    description:
      "Tapping 'send push' does nothing. I can still use a code, but that's slow when I'm on calls.",
    status: "RESOLVED",
    priority: "MEDIUM",
    category: "ACCESS",
    tags: ["okta", "mfa"],
    requester: "parth@tasu.app",
    assignee: "arjun@tasu.app",
    ageDays: 12,
  },
  {
    title: "Monitor arm replacement",
    description:
      "The arm on my standing desk no longer holds height. The monitor slowly sinks to the desk.",
    status: "OPEN",
    priority: "LOW",
    category: "HARDWARE",
    tags: ["monitor", "desk"],
    requester: "maya@tasu.app",
    assignee: null,
    ageDays: 10,
  },
  {
    title: "Jira board missing tickets",
    description:
      "Half of our sprint tickets disappeared from the board. They still exist in search results.",
    status: "RESOLVED",
    priority: "HIGH",
    category: "SOFTWARE",
    tags: ["jira", "sprint"],
    requester: "parth@tasu.app",
    assignee: "priya@tasu.app",
    ageDays: 14,
  },
  {
    title: "VPN certificate error",
    description:
      "Getting 'certificate has expired' when connecting to the London endpoint. The other endpoints work.",
    status: "CLOSED",
    priority: "HIGH",
    category: "NETWORK",
    tags: ["vpn", "certificate"],
    requester: "jonah@tasu.app",
    assignee: "arjun@tasu.app",
    ageDays: 20,
  },
  {
    title: "Access to production logs",
    description:
      "Need read-only access to the production log viewer for the incident review. Approval from engineering lead is in the thread.",
    status: "OPEN",
    priority: "URGENT",
    category: "ACCESS",
    tags: ["logs", "production", "access"],
    requester: "parth@tasu.app",
    assignee: null,
    ageDays: 0,
  },
  {
    title: "Keyboard keys sticking",
    description:
      "The E and R keys stick after a small coffee spill. Wondering if a replacement is possible.",
    status: "IN_PROGRESS",
    priority: "LOW",
    category: "HARDWARE",
    tags: ["keyboard"],
    requester: "jonah@tasu.app",
    assignee: "arjun@tasu.app",
    ageDays: 6,
  },
  {
    title: "Calendar invites showing wrong timezone",
    description:
      "Invites created in Google Calendar show up two hours early for the London team.",
    status: "WAITING_ON_USER",
    priority: "MEDIUM",
    category: "SOFTWARE",
    tags: ["calendar", "timezone"],
    requester: "maya@tasu.app",
    assignee: "priya@tasu.app",
    ageDays: 3,
  },
  {
    title: "MacBook won't wake from sleep",
    description:
      "Screen stays black after opening the lid. Only a hard reboot brings it back. Started after the latest OS update.",
    status: "OPEN",
    priority: "HIGH",
    category: "HARDWARE",
    tags: ["macbook", "sleep", "macos"],
    requester: "parth@tasu.app",
    assignee: null,
    ageDays: 1,
  },
  {
    title: "1Password vault access",
    description:
      "I can't see the Infrastructure vault. I need it to rotate the staging keys.",
    status: "RESOLVED",
    priority: "HIGH",
    category: "ACCESS",
    tags: ["1password", "vault"],
    requester: "parth@tasu.app",
    assignee: "priya@tasu.app",
    ageDays: 11,
  },
  {
    title: "Teams calls dropping",
    description:
      "Calls drop after 15–20 minutes when I'm on VPN. Works fine when disconnected.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    category: "NETWORK",
    tags: ["teams", "vpn"],
    requester: "jonah@tasu.app",
    assignee: "arjun@tasu.app",
    ageDays: 2,
  },
  {
    title: "New monitor request",
    description:
      "Requesting a 27-inch monitor for the design work. Current 24-inch makes side-by-side review hard.",
    status: "OPEN",
    priority: "LOW",
    category: "HARDWARE",
    tags: ["monitor", "request"],
    requester: "maya@tasu.app",
    assignee: null,
    ageDays: 9,
  },
  {
    title: "Dashboard showing stale numbers",
    description:
      "Revenue on the exec dashboard hasn't moved since Tuesday. The underlying query returns fresh data.",
    status: "IN_PROGRESS",
    priority: "URGENT",
    category: "SOFTWARE",
    tags: ["dashboard", "data"],
    requester: "jonah@tasu.app",
    assignee: "priya@tasu.app",
    ageDays: 1,
  },
  {
    title: "Can't print shipping labels",
    description:
      "The label printer in the mail room rejects every job with a generic driver error.",
    status: "RESOLVED",
    priority: "MEDIUM",
    category: "HARDWARE",
    tags: ["printer", "shipping"],
    requester: "jonah@tasu.app",
    assignee: "arjun@tasu.app",
    ageDays: 16,
  },
  {
    title: "Admin access to SharePoint site",
    description:
      "Taking over ownership of the Ops site while Dana is on leave. Need admin rights for two weeks.",
    status: "WAITING_ON_USER",
    priority: "MEDIUM",
    category: "ACCESS",
    tags: ["sharepoint", "admin"],
    requester: "jonah@tasu.app",
    assignee: "priya@tasu.app",
    ageDays: 4,
  },
  {
    title: "Headphones not detected",
    description:
      "Sony headphones connect over Bluetooth but don't appear as an audio output on my Mac.",
    status: "CLOSED",
    priority: "LOW",
    category: "HARDWARE",
    tags: ["headphones", "bluetooth"],
    requester: "maya@tasu.app",
    assignee: "arjun@tasu.app",
    ageDays: 22,
  },
  {
    title: "Slow internet in Bangalore office",
    description:
      "The whole floor is seeing 2–3 Mbps. Video calls are unusable. Started around 10am local time.",
    status: "IN_PROGRESS",
    priority: "URGENT",
    category: "NETWORK",
    tags: ["wifi", "bangalore", "office"],
    requester: "parth@tasu.app",
    assignee: "priya@tasu.app",
    ageDays: 0,
  },
  {
    title: "Salesforce login locked",
    description:
      "My Salesforce account is locked after too many attempts. I need it for the renewal calls this afternoon.",
    status: "RESOLVED",
    priority: "URGENT",
    category: "ACCESS",
    tags: ["salesforce", "login"],
    requester: "jonah@tasu.app",
    assignee: "priya@tasu.app",
    ageDays: 8,
  },
  {
    title: "Laptop fan loud after update",
    description:
      "The fan runs at full speed even when idle since the last OS update. Battery life dropped too.",
    status: "OPEN",
    priority: "LOW",
    category: "HARDWARE",
    tags: ["laptop", "fan", "macos"],
    requester: "maya@tasu.app",
    assignee: null,
    ageDays: 5,
  },
  {
    title: "Notion page permissions",
    description:
      "The product roadmap page says I need access. I'm on the product team and used to have edit rights.",
    status: "WAITING_ON_USER",
    priority: "LOW",
    category: "ACCESS",
    tags: ["notion", "permissions"],
    requester: "parth@tasu.app",
    assignee: "arjun@tasu.app",
    ageDays: 6,
  },
  {
    title: "Mobile email not syncing",
    description:
      "Outlook on Android stopped syncing yesterday. Removing and re-adding the account asks for a password that I don't have.",
    status: "OPEN",
    priority: "MEDIUM",
    category: "SOFTWARE",
    tags: ["outlook", "mobile"],
    requester: "jonah@tasu.app",
    assignee: null,
    ageDays: 2,
  },
  {
    title: "Office door badge not working",
    description:
      "My badge opens the front door but not the 5th floor stairwell. Started this morning.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    category: "HARDWARE",
    tags: ["badge", "office"],
    requester: "maya@tasu.app",
    assignee: "priya@tasu.app",
    ageDays: 1,
  },
  {
    title: "Request second monitor",
    description:
      "Requesting a second 24-inch monitor for the finance close. Approval from my manager is attached.",
    status: "RESOLVED",
    priority: "LOW",
    category: "HARDWARE",
    tags: ["monitor", "request"],
    requester: "jonah@tasu.app",
    assignee: "arjun@tasu.app",
    ageDays: 18,
  },
  {
    title: "Chrome crashing on large sheets",
    description:
      "Chrome crashes whenever I open the quarterly model in Google Sheets. Safari works but is very slow.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    category: "SOFTWARE",
    tags: ["chrome", "sheets"],
    requester: "jonah@tasu.app",
    assignee: "arjun@tasu.app",
    ageDays: 4,
  },
  {
    title: "Meeting room display no signal",
    description:
      "The display in room 5 says 'no signal' for every HDMI input. The room is booked all afternoon.",
    status: "OPEN",
    priority: "HIGH",
    category: "HARDWARE",
    tags: ["display", "meeting-room"],
    requester: "parth@tasu.app",
    assignee: null,
    ageDays: 0,
  },
];

const ARTICLE_SEEDS: {
  title: string;
  body: string;
  category: Category;
  tags: string[];
}[] = [
  {
    title: "Connect to the VPN on macOS",
    body: `## Before you start\n\nInstall **Okta Verify** and confirm you can sign in to the company dashboard.\n\n## Connect\n\n1. Open **System Settings → VPN**.\n2. Choose **Tasu Corporate** and select **Connect**.\n3. Approve the Okta push notification.\n\n## If the connection drops\n\nDisconnect, quit the VPN client from the menu bar, and reconnect. If it keeps dropping, note the endpoint you're using and open a ticket with the **Network** category.\n\n> The London endpoint was retired in September. Use **Amsterdam** or **Virginia**.`,
    category: "NETWORK",
    tags: ["vpn", "macos", "network"],
  },
  {
    title: "Fix an expired Adobe license",
    body: `## Check your assignment\n\nOpen the Adobe admin console link in your welcome email and confirm your seat is assigned to your @tasu.app address.\n\n## Refresh the license\n\n1. Quit every Adobe app.\n2. Open **Creative Cloud → Sign out**, then sign back in.\n3. Launch Photoshop and confirm the license status.\n\nIf your seat shows **unassigned**, reply to your ticket and IT will reassign it.`,
    category: "SOFTWARE",
    tags: ["adobe", "license", "creative-cloud"],
  },
  {
    title: "Request access to a database",
    body: `## What you'll need\n\n- The database name and environment (staging or production).\n- Read-only or read-write access.\n- Your manager's approval in the ticket thread.\n\n## How long it takes\n\nStaging access is usually granted within **one business hour**. Production access requires a second approval and is reviewed daily at 4pm.\n\n## Security notes\n\nNever store credentials in a document or chat. Use **1Password** and the shared **Engineering** vault.`,
    category: "ACCESS",
    tags: ["database", "access", "security"],
  },
  {
    title: "Printer troubleshooting",
    body: `## Quick checks\n\n1. Confirm the printer has power and paper.\n2. Open **Settings → Printers** and check whether the status is **Offline**.\n3. Remove the printer and add it again by IP address.\n\n## Still offline?\n\nMost office printers recover after a power cycle. If the device stays offline for more than 10 minutes, open a ticket with the printer's floor and asset tag.`,
    category: "HARDWARE",
    tags: ["printer", "hardware", "office"],
  },
  {
    title: "Set up a new hire's laptop",
    body: `## Before the first day\n\n- Confirm the start date and role with the hiring manager.\n- Reserve a laptop from the IT closet.\n- Create accounts for email, Slack, and the tools listed in the role template.\n\n## First-day checklist\n\n1. Enroll the device in MDM.\n2. Sign in with the new hire's company account.\n3. Install the department software bundle.\n4. Schedule a 15-minute handoff call.\n\n> Do not share the temporary password over email. Use the secure handoff screen instead.`,
    category: "HARDWARE",
    tags: ["onboarding", "laptop", "it"],
  },
  {
    title: "Why Slack notifications stop on iPhone",
    body: `## Check Focus and permissions\n\n1. Open **Settings → Notifications → Slack** and enable **Allow Notifications**.\n2. Confirm Focus mode is not silencing Slack.\n3. Open Slack → **Notifications** and set **Notify me** to *All new messages* for your key channels.\n\n## Re-register push\n\nSign out of Slack, quit the app, and sign back in. This refreshes the push token with Apple.\n\nIf notifications still don't arrive after 10 minutes, open a ticket and mention your iOS version.`,
    category: "SOFTWARE",
    tags: ["slack", "mobile", "notifications"],
  },
  {
    title: "Improve Wi-Fi in meeting rooms",
    body: `## Before the call\n\n- Join the **Tasu-5G** network, not the guest network.\n- Close apps that sync large files.\n- If the room has a wired dock, use it.\n\n## Report a dead zone\n\nOpen a ticket with the room number, the time, and whether the issue affects everyone in the room. Network logs are kept for 14 days, so report problems the same day.\n\nMeeting room 3 is scheduled for an access-point upgrade this quarter.`,
    category: "NETWORK",
    tags: ["wifi", "meeting-room", "network"],
  },
  {
    title: "Reset your password safely",
    body: `## Self-service reset\n\n1. Go to the sign-in page and choose **Forgot password**.\n2. Enter your @tasu.app address.\n3. Approve the Okta Verify push.\n4. Choose a new password with at least 14 characters.\n\n## If you're locked out\n\nOpen a ticket from a personal device. IT will verify your identity before resetting the account.\n\n> Support will never ask for your password in chat. If someone does, report it immediately.`,
    category: "ACCESS",
    tags: ["password", "okta", "security"],
  },
  {
    title: "Connect to GitHub with SSO",
    body: `## Authorize the organization\n\n1. Sign in to GitHub with your company email.\n2. Open **Settings → Organizations** and choose **Tasu**.\n3. Select **Authorize** next to the Okta SSO entry.\n\n## If it loops\n\nClear cookies for github.com, sign out of Okta, and try again in a private window. If the loop continues, attach the time of the attempt to your ticket — IT can trace the SAML response.`,
    category: "ACCESS",
    tags: ["github", "sso", "okta"],
  },
  {
    title: "Use 1Password for shared credentials",
    body: `## Vaults\n\n- **Personal** — your own logins.\n- **Team** — shared with your department.\n- **Infrastructure** — production credentials, requires approval.\n\n## Sharing rules\n\nNever paste a password into Slack, email, or a ticket. Share a 1Password item instead, and set an expiry for temporary access.\n\n## Request access\n\nOpen a ticket with the vault name, the reason, and your manager's approval. Access is reviewed monthly.`,
    category: "ACCESS",
    tags: ["1password", "security", "credentials"],
  },
  {
    title: "Speed up a slow Mac",
    body: `## First, check the obvious\n\n1. Open **Activity Monitor** and sort by CPU.\n2. Check **Storage** — keep at least 10% free.\n3. Restart the Mac; uptime over two weeks is common.\n\n## Battery and thermals\n\nIf the fan is loud at idle, the battery may be swelling or a background process may be stuck. Open a ticket with a screenshot of Activity Monitor and your battery health.`,
    category: "HARDWARE",
    tags: ["macos", "performance", "battery"],
  },
  {
    title: "Set up your calendar timezone",
    body: `## Company default\n\nEveryone's calendar should use **your local timezone**, with working hours set to 9am–6pm local.\n\n## Fix invite times\n\n1. Open Google Calendar → **Settings → Time zone**.\n2. Set the primary timezone and enable **Use this timezone for new events**.\n3. Ask the organizer to recreate any recurring invites created before the change.\n\nIf times are still wrong after that, send the event ID to IT.`,
    category: "SOFTWARE",
    tags: ["calendar", "timezone", "google"],
  },
];

async function main() {
  console.log("→ Clearing existing demo data");
  await prisma.reply.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();

  console.log("→ Creating users");
  const password = await hashPassword(DEMO_PASSWORD);
  const users = new Map<string, { id: string }>();

  for (const seed of SEED_USERS) {
    const id = crypto.randomUUID();
    await prisma.user.create({
      data: {
        id,
        name: seed.name,
        email: seed.email,
        emailVerified: true,
        role: seed.role,
        department: seed.department,
        title: seed.title,
        avatarColor: avatarColor(seed.email),
        accounts: {
          create: {
            id: crypto.randomUUID(),
            accountId: id,
            providerId: "credential",
            password,
          },
        },
      },
    });
    users.set(seed.email, { id });
  }

  const agents = SEED_USERS.filter((u) => u.role !== "employee");

  console.log("→ Creating knowledge articles");
  for (const article of ARTICLE_SEEDS) {
    const slug = article.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    const author = users.get(pick(agents).email);
    await prisma.knowledgeArticle.create({
      data: {
        slug,
        title: article.title,
        body: article.body,
        category: article.category,
        tags: article.tags,
        authorId: author!.id,
        views: between(40, 520),
        helpfulCount: between(4, 48),
        notHelpfulCount: between(0, 7),
        createdAt: new Date(Date.now() - between(10, 60) * DAY),
      },
    });
  }

  console.log("→ Creating tickets and replies");
  let sequence = 1040;

  for (let index = 0; index < TICKET_SEEDS.length; index += 1) {
    const seed = TICKET_SEEDS[index];
    sequence += 1;

    const done = seed.status === "RESOLVED" || seed.status === "CLOSED";
    const sla = SLA[seed.priority];
    // Resolved tickets should look resolved: a believable handling time, and a
    // resolution that mostly lands inside the target. The deliberate breaches
    // in the demo are a small minority of still-active tickets.
    const resolvedRecently = seed.status === "RESOLVED" && index % 3 === 0;
    const resolutionHours =
      done && index % 11 === 4
        ? sla.resolve + between(2, 6)
        : between(2, Math.max(3, Math.min(18, Math.floor(sla.resolve * 0.7))));
    const deliberateBreach = !done && index % 9 === 2;
    const capDays = done
      ? Math.max(seed.ageDays, (resolutionHours + between(4, 30)) / 24)
      : Math.max(
          0.03,
          ((seed.status === "OPEN" ? sla.first : sla.resolve) * 0.72) / 24
        );
    const ageDays = done
      ? resolvedRecently
        ? (resolutionHours + between(1, 4)) / 24
        : capDays
      : deliberateBreach
        ? seed.ageDays
        : Math.min(seed.ageDays, capDays);
    const createdAt = new Date(
      Date.now() - ageDays * DAY - between(5, 90) * 60 * 1000
    );

    const firstResponseDue = new Date(
      createdAt.getTime() + sla.first * 60 * 60 * 1000
    );
    const resolveDue = new Date(
      createdAt.getTime() + sla.resolve * 60 * 60 * 1000
    );
    const requester = users.get(seed.requester)!;
    const assignee = seed.assignee ? users.get(seed.assignee)! : null;
    const staff = agents[between(0, agents.length - 1)];
    const staffUser = users.get(staff.email)!;

    const resolvedAt = done
      ? new Date(createdAt.getTime() + resolutionHours * 60 * 60 * 1000)
      : null;

    const respondedAt =
      seed.status === "OPEN"
        ? null
        : done
          ? new Date(
              createdAt.getTime() +
                Math.min(
                  between(8, 55) * 60 * 1000,
                  Math.max(5, resolutionHours * 60 - 5) * 60 * 1000
                )
            )
          : new Date(
              Math.min(
                Date.now() - between(2, 20) * 60 * 1000,
                createdAt.getTime() + between(8, 55) * 60 * 1000
              )
            );

    const ticket = await prisma.ticket.create({
      data: {
        key: `HD-${sequence}`,
        title: seed.title,
        description: seed.description,
        status: seed.status,
        priority: seed.priority,
        category: seed.category,
        tags: seed.tags,
        requesterId: requester.id,
        assigneeId: assignee?.id ?? null,
        slaFirstResponseDueAt: firstResponseDue,
        slaResolveDueAt: resolveDue,
        firstResponseAt: respondedAt,
        resolvedAt,
        closedAt:
          seed.status === "CLOSED" && resolvedAt
            ? new Date(
                Math.min(
                  resolvedAt.getTime() + 2 * DAY,
                  Date.now() - 60 * 60 * 1000
                )
              )
            : null,
        createdAt,
        lastActivityAt: createdAt,
      },
    });

    // System activity + a believable conversation.
    const events: {
      authorId: string;
      body: string;
      type: ReplyType;
      isInternal?: boolean;
      at: Date;
    }[] = [];

    if (assignee) {
      const assigner = agents.find((agent) => agent.email !== seed.assignee);
      events.push({
        authorId: users.get(assigner?.email ?? seed.requester)!.id,
        body: `Assigned to ${SEED_USERS.find((u) => u.email === seed.assignee)?.name}.`,
        type: "SYSTEM",
        at: new Date(createdAt.getTime() + 12 * 60 * 1000),
      });
    }

    if (respondedAt) {
      events.push({
        authorId: assignee?.id ?? staffUser.id,
        body: pick([
          "Thanks for flagging this — I'm looking into it now. Could you tell me when the issue started?",
          "I've reproduced this on my machine. Trying a fix and I'll update you shortly.",
          "I can see the error on our side. Give me about 20 minutes and I'll have an update.",
          "Thanks for the detail. I'm checking whether this is related to yesterday's update.",
        ]),
        type: "REPLY",
        at: respondedAt,
      });
    }

    if (seed.requester !== seed.assignee && respondedAt) {
      events.push({
        authorId: requester.id,
        body: pick([
          "It started yesterday afternoon, right after the update. Happy to jump on a call if that helps.",
          "Thanks. It's still happening this morning — let me know if you need me to try anything.",
          "I tried restarting once and it came back after a few minutes. Screenshot attached in the next message.",
          "Appreciate the quick response. I can test whenever you're ready.",
        ]),
        type: "REPLY",
        at: new Date(respondedAt.getTime() + between(20, 120) * 60 * 1000),
      });
    }

    if (index % 4 === 0 && assignee) {
      events.push({
        authorId: assignee.id,
        body: "Internal note: checked the device record and the warranty expires next month. If this needs a hardware swap, route it through the refresh budget.",
        type: "REPLY",
        isInternal: true,
        at: new Date(
          respondedAt?.getTime() ?? createdAt.getTime() + 45 * 60 * 1000
        ),
      });
    }

    if (seed.status === "WAITING_ON_USER" || seed.status === "RESOLVED") {
      events.push({
        authorId: assignee?.id ?? staffUser.id,
        body:
          seed.status === "WAITING_ON_USER"
            ? pick([
                "Could you confirm the exact model of the device and whether the issue happens on another network?",
                "I need one more detail before I can proceed: the approximate time of the last failure.",
                "Can you share a screenshot of the error? That will help me narrow it down.",
              ])
            : "This should be resolved now. Please give it a try and confirm so we can close it out.",
        type: "REPLY",
        at: new Date(
          Math.min(
            Date.now() - between(30, 240) * 60 * 1000,
            (respondedAt?.getTime() ?? createdAt.getTime()) + 4 * 60 * 60 * 1000
          )
        ),
      });
    }

    if (seed.status === "CLOSED") {
      events.push({
        authorId: staffUser.id,
        body: "Closed after the requester confirmed the fix. Reopen by replying if it comes back.",
        type: "SYSTEM",
        at: new Date(Date.now() - between(1, 5) * DAY),
      });
    }

    events.sort((a, b) => a.at.getTime() - b.at.getTime());

    for (const event of events) {
      await prisma.reply.create({
        data: {
          ticketId: ticket.id,
          authorId: event.authorId,
          body: event.body,
          type: event.type,
          isInternal: event.isInternal ?? false,
          createdAt: event.at,
        },
      });
    }

    const lastAt = events.length ? events[events.length - 1].at : createdAt;

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        replyCount: events.length,
        lastActivityAt: lastAt,
      },
    });
  }

  await prisma.counter.create({
    data: { id: "ticket", seq: sequence },
  });

  console.log(
    `✓ Seeded ${SEED_USERS.length} users, ${TICKET_SEEDS.length} tickets, ${ARTICLE_SEEDS.length} articles`
  );
  console.log(`  Demo sign-in: parth@tasu.app / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
