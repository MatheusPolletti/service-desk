import ContactForm from "./components/contract-form";
import Tickets from "./components/tickets";

export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center bg-white font-sans">
      <main className="flex h-screen w-full flex-col items-center justify-center bg-white">
        <div className="flex justify-end items-end w-full mr-10">
          <ContactForm />
        </div>
        <Tickets />
      </main>
    </div>
  );
}
