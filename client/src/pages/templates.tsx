import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Eye, Plus, Upload, Trash2, Edit, File, FileImage, FileArchive, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Document } from "@shared/schema";

const getFileIcon = (mimeType?: string | null) => {
  if (!mimeType) return FileText;
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("zip") || mimeType.includes("archive")) return FileArchive;
  if (mimeType.includes("pdf")) return File;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return FileSpreadsheet;
  return FileText;
};

const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [newDocName, setNewDocName] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [editDocName, setEditDocName] = useState("");
  const [editDocContent, setEditDocContent] = useState("");

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; content?: string; fileName?: string; fileData?: string; mimeType?: string; fileSize?: number }) => {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsCreateDialogOpen(false);
      setNewDocName("");
      setNewDocContent("");
      toast({ title: "Document créé", description: "Le document a été créé avec succès." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le document.", variant: "destructive" });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; content?: string } }) => {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsEditDialogOpen(false);
      setSelectedDocument(null);
      toast({ title: "Document modifié", description: "Le document a été modifié avec succès." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le document.", variant: "destructive" });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete document");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Document supprimé", description: "Le document a été supprimé avec succès." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer le document.", variant: "destructive" });
    },
  });

  const handleCreateTextDocument = () => {
    if (!newDocName.trim()) {
      toast({ title: "Erreur", description: "Le nom du document est requis.", variant: "destructive" });
      return;
    }
    createDocumentMutation.mutate({
      name: newDocName,
      type: "text",
      content: newDocContent,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({ title: "Erreur", description: "Le fichier est trop volumineux (max 5MB).", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      createDocumentMutation.mutate({
        name: file.name,
        type: "file",
        fileName: file.name,
        fileData: base64,
        mimeType: file.type,
        fileSize: file.size,
      });
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setIsViewDialogOpen(true);
  };

  const handleEditDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setEditDocName(doc.name);
    setEditDocContent(doc.content || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedDocument || !editDocName.trim()) return;
    updateDocumentMutation.mutate({
      id: selectedDocument.id,
      data: { name: editDocName, content: editDocContent },
    });
  };

  const handleDownloadFile = (doc: Document) => {
    if (doc.type === "file" && doc.fileData) {
      const link = document.createElement("a");
      link.href = doc.fileData;
      link.download = doc.fileName || doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-templates-title">
            Documents
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos documents et templates
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.zip,.xls,.xlsx,.csv"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} data-testid="button-upload-file">
            <Upload className="h-4 w-4 mr-2" />
            Importer un fichier
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-document">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Créer un nouveau document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-name">Nom du document</Label>
                  <Input
                    id="doc-name"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="Ex: Contrat type, Modèle de devis..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-content">Contenu</Label>
                  <Textarea
                    id="doc-content"
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    placeholder="Saisissez le contenu du document..."
                    className="min-h-[300px] font-mono"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button onClick={handleCreateTextDocument} disabled={createDocumentMutation.isPending}>
                  {createDocumentMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[160px]" />
          ))}
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const FileIcon = getFileIcon(doc.mimeType);
            return (
              <Card key={doc.id} className="hover-elevate" data-testid={`card-document-${doc.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="rounded-md bg-primary/10 p-2 shrink-0">
                        <FileIcon className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="text-base font-semibold truncate">
                        {doc.name}
                      </CardTitle>
                    </div>
                    <Badge variant={doc.type === "file" ? "secondary" : "outline"} className="shrink-0">
                      {doc.type === "file" ? "Fichier" : "Texte"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-3">
                    {doc.type === "file" ? (
                      <span>{formatFileSize(doc.fileSize)}</span>
                    ) : (
                      <span className="line-clamp-2">{doc.content || "Document vide"}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(doc.createdAt), "d MMM yyyy", { locale: fr })}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)} data-testid={`button-view-document-${doc.id}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {doc.type === "text" && (
                        <Button variant="ghost" size="sm" onClick={() => handleEditDocument(doc)} data-testid={`button-edit-document-${doc.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`button-delete-document-${doc.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer le document ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. Le document "{doc.name}" sera définitivement supprimé.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteDocumentMutation.mutate(doc.id)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Aucun document</h3>
          <p className="text-muted-foreground mb-4">
            Créez un document texte ou importez un fichier
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-document">
              <Plus className="h-4 w-4 mr-2" />
              Créer un document
            </Button>
          </div>
        </div>
      )}

      {/* View Document Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedDocument?.type === "text" ? (
              <div className="bg-muted/50 rounded-lg p-4 max-h-[50vh] overflow-auto">
                <pre className="whitespace-pre-wrap font-mono text-sm">{selectedDocument.content || "Document vide"}</pre>
              </div>
            ) : selectedDocument?.type === "file" ? (
              <div className="space-y-4">
                {selectedDocument.mimeType?.startsWith("image/") && selectedDocument.fileData ? (
                  <img src={selectedDocument.fileData} alt={selectedDocument.name} className="max-w-full rounded-lg" />
                ) : (
                  <div className="text-center py-8">
                    <File className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">{selectedDocument.fileName}</p>
                    <p className="text-sm text-muted-foreground mb-4">{formatFileSize(selectedDocument.fileSize)}</p>
                    <Button onClick={() => handleDownloadFile(selectedDocument)}>
                      Télécharger
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            {selectedDocument?.type === "file" && (
              <Button variant="outline" onClick={() => handleDownloadFile(selectedDocument)}>
                Télécharger
              </Button>
            )}
            <DialogClose asChild>
              <Button>Fermer</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier le document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-doc-name">Nom du document</Label>
              <Input
                id="edit-doc-name"
                value={editDocName}
                onChange={(e) => setEditDocName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-doc-content">Contenu</Label>
              <Textarea
                id="edit-doc-content"
                value={editDocContent}
                onChange={(e) => setEditDocContent(e.target.value)}
                className="min-h-[300px] font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleSaveEdit} disabled={updateDocumentMutation.isPending}>
              {updateDocumentMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
