"use client";

import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deletePrivateDataAction } from "@/app/(app)/conta/actions";
import { ChoiceTile } from "@/components/choice-tile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export function ExportData() {
  return (
    <div className="space-y-3">
      <p className="leading-relaxed">
        Um arquivo JSON com tudo o que está guardado sobre você: perfil, diagnósticos, progresso,
        respostas, revisões, conversas com o tutor e notas de pronúncia.
      </p>
      <Button asChild variant="outline" className="h-11 rounded-xl px-5">
        <a href="/api/conta/dados" download>
          <Download aria-hidden /> Baixar meus dados
        </a>
      </Button>
    </div>
  );
}

export function DeletePrivateData({
  counts,
}: {
  counts: { conversations: number; corrections: number; speechAttempts: number };
}) {
  const router = useRouter();
  const [selection, setSelection] = useState({
    conversations: false,
    corrections: false,
    speech: false,
  });
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const any = selection.conversations || selection.corrections || selection.speech;
  const toggle = (key: keyof typeof selection) => (checked: boolean) =>
    setSelection((current) => ({ ...current, [key]: checked }));

  function confirm() {
    startTransition(async () => {
      const result = await deletePrivateDataAction(selection);
      setOpen(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSelection({ conversations: false, corrections: false, speech: false });
      toast.success("Dados apagados");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        <ChoiceTile
          type="checkbox"
          name="delete"
          value="conversations"
          checked={selection.conversations}
          onChange={toggle("conversations")}
          title="Conversas com o tutor"
          description={`${plural(counts.conversations, "conversa", "conversas")}, com mensagens e relatórios.`}
        />
        <ChoiceTile
          type="checkbox"
          name="delete"
          value="corrections"
          checked={selection.corrections}
          onChange={toggle("corrections")}
          title="Correções salvas para revisão"
          description={`${plural(counts.corrections, "correção", "correções")} do caderno e o histórico de revisão delas.`}
        />
        <ChoiceTile
          type="checkbox"
          name="delete"
          value="speech"
          checked={selection.speech}
          onChange={toggle("speech")}
          title="Avaliações de fala"
          description={`${plural(counts.speechAttempts, "avaliação", "avaliações")}: transcrições e notas. O áudio nunca é guardado.`}
        />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="destructive"
            disabled={!any}
            className="h-11 rounded-xl px-5"
          >
            Apagar selecionados
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apagar esses dados?</DialogTitle>
            <DialogDescription>
              Isso não pode ser desfeito. Seu progresso nas lições e revisões continua.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={confirm} disabled={pending}>
              {pending ? "Apagando…" : "Apagar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const CONFIRM_WORD = "EXCLUIR";

export function DeleteAccount() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [word, setWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const { error: failure } = await authClient.deleteUser({ password });
      if (failure) {
        setError(
          failure.status === 400 || failure.status === 401
            ? "Senha incorreta."
            : "Não foi possível excluir a conta agora. Tente de novo.",
        );
        return;
      }
      toast.success("Sua conta foi excluída.");
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" className="h-11 rounded-xl px-5">
          Excluir minha conta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Excluir a conta para sempre?</DialogTitle>
            <DialogDescription>
              Todo o seu progresso, diagnósticos, conversas e preferências serão apagados
              imediatamente. Isso não pode ser desfeito.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-password">Sua senha</Label>
            <Input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              Digite <strong>{CONFIRM_WORD}</strong> para confirmar
            </Label>
            <Input
              id="delete-confirm"
              value={word}
              onChange={(event) => setWord(event.target.value)}
              autoComplete="off"
              className="h-11 rounded-xl"
            />
          </div>
          {error && (
            <p
              role="alert"
              className="text-destructive bg-destructive-soft rounded-lg px-3 py-2 text-sm"
            >
              {error}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending || word.trim() !== CONFIRM_WORD || password.length === 0}
            >
              {pending ? "Excluindo…" : "Excluir conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
