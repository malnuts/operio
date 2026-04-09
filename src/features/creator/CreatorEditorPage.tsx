import { Link, useNavigate, useSearchParams } from "react-router-dom";

import CreatorShell from "@/components/CreatorShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageContext } from "@/features/agent/usePageContext";
import CreatorContentForm from "@/features/creator/CreatorContentForm";
import {
  type CreatorContentInput,
  type CreatorContentKind,
  type CreatorPublicationStatus,
} from "@/features/creator/schema";
import { buildCreatorEntry } from "@/features/creator/storage";
import { useCreatorLibrary } from "@/features/creator/useCreatorLibrary";
import { useI18n } from "@/hooks/useI18n";

const CreatorEditorPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getEntry, saveEntry } = useCreatorLibrary();

  const entryId = searchParams.get("id");
  const kindParam = searchParams.get("kind");
  const entry = entryId ? getEntry(entryId) : null;
  const selectedKind: CreatorContentKind = entry?.kind ?? (kindParam === "post" ? "post" : "procedure");
  const isEditing = Boolean(entryId);

  usePageContext({
    role: "creator",
    page: "creator-editor",
    contentType: selectedKind === "post" ? "post" : "procedure",
    contentTitle: entry?.title,
    creatorDraft: entry ? {
      kind: entry.kind,
      title: entry.title,
      status: entry.status,
    } : undefined,
  }, [selectedKind, entry]);

  const submitEntry = (input: CreatorContentInput, status: CreatorPublicationStatus) => {
    saveEntry(buildCreatorEntry(input, status, entry));
    navigate("/creator/library");
  };

  if (entryId && !entry) {
    return (
      <CreatorShell
        badge={t("creator.editor.badge")}
        title={t("creator.editor.missing.title")}
        description={t("creator.editor.missing.description")}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t("creator.editor.missing.title")}</CardTitle>
            <CardDescription>{t("creator.editor.missing.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/creator/library">{t("creator.editor.missing.action")}</Link>
            </Button>
          </CardContent>
        </Card>
      </CreatorShell>
    );
  }

  return (
    <CreatorShell
      badge={t("creator.editor.badge")}
      title={t(isEditing ? "creator.editor.title.edit" : "creator.editor.title.new")}
      description={t(isEditing ? "creator.editor.description.edit" : "creator.editor.description.new")}
      actions={entry ? (
        <Badge variant="outline">{t(`creator.visibility.${entry.visibility}`)}</Badge>
      ) : undefined}
    >
      <CreatorContentForm
        kind={selectedKind}
        isEditing={isEditing}
        entry={entry}
        onKindChange={(kind) => setSearchParams({ kind })}
        onSubmit={submitEntry}
      />
    </CreatorShell>
  );
};

export default CreatorEditorPage;
