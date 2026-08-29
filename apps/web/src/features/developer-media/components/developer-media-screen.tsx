'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeveloperProject } from '@planda/api-contract';
import { useAuthorization } from '@/lib/permissions/authorization-context';
import {
  listItems,
  operationsRequest,
  type OperationError,
} from '@/features/operations/api/operations-client';
import type { DeveloperMedia } from '@/features/operations/api/growth-types';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxBytes = 10 * 1024 * 1024;

export function DeveloperMediaScreen() {
  const t = useTranslations('DeveloperMedia');
  const { canManageOrganization } = useAuthorization();
  const [projects, setProjects] = useState<DeveloperProject[]>([]);
  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState<DeveloperMedia[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [feedback, setFeedback] = useState('');
  const selectedProject = projects.find((project) => project.id === projectId);
  const canManage = selectedProject
    ? canManageOrganization(selectedProject.developerOrganizationId)
    : false;

  const loadProjects = useCallback(async () => {
    setState('loading');
    try {
      const response = await operationsRequest<
        DeveloperProject[] | { items: DeveloperProject[] }
      >('/developer/projects');
      const available = listItems(response);
      setProjects(available);
      setProjectId((current) => current || available[0]?.id || '');
      if (!available.length) setState('ready');
    } catch {
      setState('error');
    }
  }, []);

  const loadMedia = useCallback(async () => {
    if (!projectId) return;
    setState('loading');
    try {
      setItems(
        await operationsRequest<DeveloperMedia[]>(
          `/developer/projects/${projectId}/media`,
        ),
      );
      setState('ready');
    } catch {
      setState('error');
    }
  }, [projectId]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => void loadProjects());
    return () => cancelAnimationFrame(frame);
  }, [loadProjects]);
  useEffect(() => {
    if (!projectId) return;
    const frame = requestAnimationFrame(() => void loadMedia());
    return () => cancelAnimationFrame(frame);
  }, [loadMedia, projectId]);

  async function upload(form: HTMLFormElement) {
    const data = new FormData(form);
    const file = data.get('file');
    if (!(file instanceof File) || file.size === 0) {
      setFeedback(t('fileRequired'));
      return;
    }
    if (!allowedTypes.has(file.type)) {
      setFeedback(t('invalidType'));
      return;
    }
    if (file.size > maxBytes) {
      setFeedback(t('tooLarge'));
      return;
    }
    setFeedback(t('uploading'));
    try {
      await operationsRequest(`/developer/projects/${projectId}/media`, {
        method: 'POST',
        body: data,
      });
      form.reset();
      setFeedback(t('uploaded'));
      await loadMedia();
    } catch (error) {
      setFeedback(mutationError(error as OperationError, t));
    }
  }

  async function saveAlt(media: DeveloperMedia, altText: string) {
    setFeedback(t('saving'));
    try {
      await operationsRequest(
        `/developer/projects/${projectId}/media/${media.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ version: media.version, altText }),
        },
      );
      setFeedback(t('saved'));
      await loadMedia();
    } catch (error) {
      setFeedback(mutationError(error as OperationError, t));
      if ((error as OperationError).status === 409) await loadMedia();
    }
  }

  async function remove(media: DeveloperMedia) {
    if (!window.confirm(t('deleteConfirm'))) return;
    setFeedback(t('deleting'));
    try {
      await operationsRequest(
        `/developer/projects/${projectId}/media/${media.id}?version=${media.version}`,
        { method: 'DELETE' },
      );
      setFeedback(t('deleted'));
      await loadMedia();
    } catch (error) {
      setFeedback(mutationError(error as OperationError, t));
      if ((error as OperationError).status === 409) await loadMedia();
    }
  }

  async function move(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= items.length) return;
    const ordered = [...items];
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    setItems(ordered);
    setFeedback(t('reordering'));
    try {
      setItems(
        await operationsRequest<DeveloperMedia[]>(
          `/developer/projects/${projectId}/media/reorder`,
          {
            method: 'PUT',
            body: JSON.stringify({
              items: ordered.map(({ id, version }) => ({ id, version })),
            }),
          },
        ),
      );
      setFeedback(t('reordered'));
    } catch (error) {
      setFeedback(mutationError(error as OperationError, t));
      await loadMedia();
    }
  }

  return (
    <section
      className="growth-screen"
      aria-labelledby="developer-media-title"
      aria-busy={state === 'loading'}
    >
      <header className="growth-heading">
        <div>
          <span className="eyebrow">{t('eyebrow')}</span>
          <h1 id="developer-media-title">{t('title')}</h1>
          <p>{t('description')}</p>
        </div>
        {projects.length > 0 && (
          <label>
            <span>{t('project')}</span>
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>
      {feedback && (
        <p className="privacy-callout" role="status" aria-live="polite">
          {feedback}
        </p>
      )}
      {state === 'loading' && <MediaState text={t('loading')} />}
      {state === 'error' && (
        <MediaState
          text={t('loadFailed')}
          action={projectId ? loadMedia : loadProjects}
          actionLabel={t('retry')}
        />
      )}
      {state === 'ready' && projects.length === 0 && (
        <MediaState text={t('noProjects')} />
      )}
      {state === 'ready' && projectId && (
        <>
          {!canManage && (
            <p className="privacy-callout" role="status">
              {t('readonly')}
            </p>
          )}
          {canManage && (
            <form
              className="ops-card media-upload"
              onSubmit={(event) => {
                event.preventDefault();
                void upload(event.currentTarget);
              }}
            >
              <label>
                <span>{t('file')}</span>
                <input
                  name="file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                />
              </label>
              <label>
                <span>{t('altText')}</span>
                <input name="altText" maxLength={240} />
              </label>
              <input type="hidden" name="kind" value="IMAGE" />
              <button className="button" type="submit">
                {t('upload')}
              </button>
              <small>{t('uploadRules')}</small>
            </form>
          )}
          {items.length === 0 ? (
            <MediaState text={t('empty')} />
          ) : (
            <div className="developer-media-grid">
              {items.map((media, index) => (
                <article key={media.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media.url} alt={media.altText ?? ''} />
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      void saveAlt(
                        media,
                        String(form.get('altText') ?? '').trim(),
                      );
                    }}
                  >
                    <label>
                      <span>{t('altText')}</span>
                      <input
                        name="altText"
                        defaultValue={media.altText ?? ''}
                        maxLength={240}
                        disabled={!canManage}
                      />
                    </label>
                    <div className="media-actions">
                      <button
                        type="button"
                        disabled={!canManage || index === 0}
                        aria-label={t('moveUpLabel', { index: index + 1 })}
                        onClick={() => void move(index, -1)}
                      >
                        ↑ {t('moveUp')}
                      </button>
                      <button
                        type="button"
                        disabled={!canManage || index === items.length - 1}
                        aria-label={t('moveDownLabel', { index: index + 1 })}
                        onClick={() => void move(index, 1)}
                      >
                        ↓ {t('moveDown')}
                      </button>
                      <button type="submit" disabled={!canManage}>
                        {t('saveAlt')}
                      </button>
                      <button
                        type="button"
                        className="danger-link"
                        disabled={!canManage}
                        onClick={() => void remove(media)}
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </form>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function MediaState({
  text,
  action,
  actionLabel,
}: {
  text: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="empty-state" role={action ? 'alert' : 'status'}>
      <p>{text}</p>
      {action && (
        <button className="button" type="button" onClick={action}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function mutationError(
  error: OperationError,
  t: ReturnType<typeof useTranslations<'DeveloperMedia'>>,
) {
  if (error.status === 409) return t('conflict');
  if (error.status === 403) return t('forbidden');
  return t('operationFailed', { requestId: error.requestId ?? 'none' });
}
